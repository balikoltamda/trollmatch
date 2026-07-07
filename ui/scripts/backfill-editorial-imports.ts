import { resolve } from "node:path";
import { loadEnv } from "../src/lib/load-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { enrichCanonicalForEditorial } from "../src/modules/import/enrichment/editorial-product-enricher";
import { rebuildCanonicalFromLureModel } from "../src/modules/import/enrichment/rebuild-canonical-from-db";
import { upsertCanonicalImport } from "../src/modules/import/persistence/canonical-import-persister";
import {
  createEmptyImportSummary,
  mergeImportSummaries,
  printImportSummary,
} from "../src/modules/import/persistence";
import { triggerEditorialReviewBatch } from "../src/modules/studio/ai-review/lib/trigger-editorial-review";

loadEnv({ cwd: resolve(import.meta.dirname, "..") });

function printUsage(): void {
  console.log(`Usage: npm run backfill:editorial-imports -- [options]

Options:
  --manufacturer <slug>   Limit to one manufacturer slug (e.g. duel)
  --limit <n>             Cap products processed
  --dry-run               Rebuild + enrich only — no database writes
  --skip-review           Skip editorial intelligence batch after backfill
  -h, --help              Show this help

Strategy:
  Rebuilds canonical rows from persisted lure data, runs editorial enrichment,
  and upserts with fill-missing-only semantics. Never overwrites editor-approved values.
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printUsage();
    return;
  }

  const manufacturerSlug = (() => {
    const idx = args.findIndex((arg) => arg === "--manufacturer");
    return idx >= 0 ? args[idx + 1] : undefined;
  })();
  const limit = (() => {
    const idx = args.findIndex((arg) => arg === "--limit");
    return idx >= 0 ? Number.parseInt(args[idx + 1] ?? "", 10) : undefined;
  })();
  const dryRun = args.includes("--dry-run");
  const skipReview = args.includes("--skip-review");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("FAIL: DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const lureModels = await prisma.lureModel.findMany({
      where: {
        deletedAt: null,
        lastImportedAt: { not: null },
        ...(manufacturerSlug
          ? { manufacturer: { slug: manufacturerSlug } }
          : {}),
      },
      select: { id: true, slug: true },
      orderBy: { slug: "asc" },
      ...(limit ? { take: limit } : {}),
    });

    console.log(
      `Backfill editorial imports — ${lureModels.length} lure model(s)${manufacturerSlug ? ` (${manufacturerSlug})` : ""}${dryRun ? " [dry-run]" : ""}`,
    );

    const summary = createEmptyImportSummary();
    const enrichedIds: string[] = [];
    const importedAt = new Date();

    for (const [index, row] of lureModels.entries()) {
      const canonical = await rebuildCanonicalFromLureModel(prisma, row.id);
      if (!canonical) {
        summary.errors.push(`${row.slug}: failed to rebuild canonical row`);
        continue;
      }

      const enriched = enrichCanonicalForEditorial(canonical);

      if (dryRun) {
        summary.updated.push(`DRY-RUN ${row.slug}`);
        continue;
      }

      try {
        const result = await upsertCanonicalImport(prisma, enriched, importedAt);
        mergeImportSummaries(summary, result.summary);
        enrichedIds.push(result.lureModelId);
        console.log(`[${index + 1}/${lureModels.length}] ${row.slug}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        summary.errors.push(`${row.slug}: ${message}`);
      }
    }

    printImportSummary(summary);

    if (!dryRun && !skipReview && enrichedIds.length > 0) {
      await triggerEditorialReviewBatch(
        enrichedIds.map((entityId) => ({ entityType: "LURE", entityId })),
        "IMPORT",
        "backfill-editorial-imports",
      ).catch(() => {});
      console.log(`Triggered editorial review for ${enrichedIds.length} lure(s).`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
