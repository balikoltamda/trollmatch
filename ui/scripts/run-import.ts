import { resolve } from "node:path";
import { loadEnv } from "../src/lib/load-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { runDemoImport, resolveDemoSamplePath } from "../src/modules/import/providers/demo/demo-importer";
import {
  persistCanonicalImports,
  printImportSummary,
} from "../src/modules/import/persistence";

loadEnv({ cwd: resolve(import.meta.dirname, "..") });

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      "FAIL: DATABASE_URL is not set. Add it to ui/.env.local and ensure Postgres is running.",
    );
    process.exit(1);
  }

  const samplePath = resolveDemoSamplePath();
  const canonical = await runDemoImport(samplePath);

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const summary = await persistCanonicalImports(prisma, canonical);
    printImportSummary(summary);

    if (summary.errors.length > 0) {
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
