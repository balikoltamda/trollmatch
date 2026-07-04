import { resolve } from "node:path";
import { loadEnv } from "../src/lib/load-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { printImportSummary } from "../src/modules/import/persistence";
import {
  manufacturerRegistry,
  parseManufacturerCliFlags,
} from "../src/modules/import/registry/registered-importers";
import { buildImportReport, printImportReport } from "../src/modules/import/reporting/import-report";
import { persistImportBatch } from "../src/modules/studio/data/import-batch";

loadEnv({ cwd: resolve(import.meta.dirname, "..") });

function printUsage(): void {
  const manufacturers = manufacturerRegistry
    .list()
    .map(
      (entry) =>
        `  ${entry.code.padEnd(10)} — ${entry.displayName} [${entry.status}]`,
    )
    .join("\n");

  console.log(`Usage: npm run import -- [options]

Options:
  --manufacturer <code>   Import one manufacturer (repeatable)
  -m <code>               Alias for --manufacturer
  --all                   Import every registered manufacturer
  --limit <n>             Cap products processed per manufacturer
  --offline               Skip live HTTP fetch (DUEL: single PID snapshot)
  --no-images             Skip manufacturer image downloads
  -h, --help              Show this help

Manufacturers:
${manufacturers}

Examples:
  npm run import -- --manufacturer duel
  npm run import -- --manufacturer yozuri --manufacturer halco
  npm run import -- --all
  npm run import -- --manufacturer duel --limit 20
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const flags = parseManufacturerCliFlags(args);

  if (flags.help) {
    printUsage();
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      "FAIL: DATABASE_URL is not set. Add it to ui/.env.local and ensure Postgres is running.",
    );
    process.exit(1);
  }

  let importers;
  try {
    const codes = manufacturerRegistry.resolveCodes({
      manufacturers: flags.manufacturers,
      all: flags.all,
    });
    importers = manufacturerRegistry.resolveMany(codes);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    printUsage();
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  let hadFailure = false;

  try {
    for (const importer of importers) {
      console.log(
        `Running import: ${importer.code} (${importer.displayName}) [${importer.status}]\n`,
      );

      const result = await importer.run({
        prisma,
        argv: args,
        limit: flags.limit,
        offline: flags.offline,
        downloadImages: flags.downloadImages,
      });

      printImportSummary(result.summary);

      const report = buildImportReport({
        manufacturer: result.manufacturer,
        displayName: result.displayName,
        startedAt: new Date(result.startedAt),
        completedAt: new Date(result.completedAt),
        productsProcessed: result.productsProcessed,
        summary: result.summary,
        warnings: result.summary.warnings,
      });

      const reportPath =
        result.reportPath ??
        (await (async () => {
          const { writeImportReport } = await import(
            "../src/modules/import/reporting/import-report"
          );
          return writeImportReport(report, resolve(import.meta.dirname, "..", ".."));
        })());

      report.reportPath = reportPath;

      await persistImportBatch(prisma, result, { ...report, reportPath });

      printImportReport({ ...report, reportPath });

      if (!result.success) {
        hadFailure = true;
      }
    }

    if (hadFailure) {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
