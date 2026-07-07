import { resolve } from "node:path";
import { loadEnv } from "../src/lib/load-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { resolveImportImageUrl } from "../src/modules/import/images/persist-import-image";

loadEnv({ cwd: resolve(import.meta.dirname, "..") });

function printUsage(): void {
  console.log(`Usage: npm run backfill:image-urls -- [options]

Options:
  --limit <n>       Cap images processed
  --dry-run         Download only — no database writes
  -h, --help        Show this help

Rewrites Image.url from remote manufacturer URLs to local /media/{sha256}.ext paths.
Preserves the original remote URL in Image.sourceUrl when missing.
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printUsage();
    return;
  }

  const limit = (() => {
    const idx = args.findIndex((arg) => arg === "--limit");
    return idx >= 0 ? Number.parseInt(args[idx + 1] ?? "", 10) : undefined;
  })();
  const dryRun = args.includes("--dry-run");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("FAIL: DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const remoteImages = await prisma.image.findMany({
      where: {
        deletedAt: null,
        OR: [{ url: { startsWith: "http://" } }, { url: { startsWith: "https://" } }],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        url: true,
        sourceUrl: true,
        sha256Hash: true,
        lureModelId: true,
      },
    });

    console.log(`Found ${remoteImages.length} image(s) with remote URLs.`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const image of remoteImages) {
      const remoteUrl = image.url.trim();
      try {
        const persisted = await resolveImportImageUrl(remoteUrl);
        if (persisted.url === remoteUrl) {
          skipped += 1;
          console.log(`SKIP ${image.id}: could not localize ${remoteUrl}`);
          continue;
        }

        if (dryRun) {
          console.log(`DRY-RUN ${image.id}: ${remoteUrl} -> ${persisted.url}`);
          updated += 1;
          continue;
        }

        await prisma.image.update({
          where: { id: image.id },
          data: {
            url: persisted.url,
            sha256Hash: persisted.sha256Hash || image.sha256Hash,
            sourceUrl: image.sourceUrl ?? persisted.sourceUrl,
          },
        });
        updated += 1;
        console.log(`OK ${image.id}: ${remoteUrl} -> ${persisted.url}`);
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`FAIL ${image.id}: ${remoteUrl} (${message})`);
      }
    }

    console.log(
      `\nDone. updated=${updated} skipped=${skipped} failed=${failed} dryRun=${dryRun}`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
