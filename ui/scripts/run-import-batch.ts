import { resolve } from "node:path";
import { loadEnv } from "../src/lib/load-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { executeImportBatch } from "../src/modules/studio/data/execute-import-batch";

loadEnv({ cwd: resolve(import.meta.dirname, "..") });

async function main(): Promise<void> {
  const batchId = process.argv[2];

  if (!batchId) {
    console.error("Usage: npm run import:batch -- <batch-id>");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("FAIL: DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await executeImportBatch(prisma, batchId);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Import batch worker failed",
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
