import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { loadEnv } from "../src/lib/load-env";
import {
  printDuelImportSummary,
  runDuelImport,
} from "../src/modules/import/providers/duel/duel-import-runner";

loadEnv({ cwd: resolve(import.meta.dirname, "..") });

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      "FAIL: DATABASE_URL is not set. Add it to ui/.env.local and ensure Postgres is running.",
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const result = await runDuelImport({ prisma });
    printDuelImportSummary(result);

    if (result.summary.failed > 0) {
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
