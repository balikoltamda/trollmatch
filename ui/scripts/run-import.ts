import { resolve } from "node:path";
import { loadEnv } from "../src/lib/load-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { printImportSummary } from "../src/modules/import/persistence";
import { importRegistry } from "../src/modules/import/registry";

loadEnv({ cwd: resolve(import.meta.dirname, "..") });

function printUsage(): void {
  const providers = importRegistry
    .list()
    .map((entry) => `  ${entry.code.padEnd(8)} — ${entry.displayName}`)
    .join("\n");

  console.log(`Usage: npm run import:run [-- <provider> [options...]]

Providers:
${providers}

Default provider: ${importRegistry.getDefaultCode()}
Override with IMPORT_PROVIDER env var.
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args[0] === "--help" || args[0] === "-h") {
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

  let importer;
  try {
    importer = importRegistry.resolve(args[0]);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    printUsage();
    process.exit(1);
  }

  const providerArgs = args[0] && importRegistry.has(args[0]) ? args.slice(1) : args;

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    console.log(`Running import provider: ${importer.code} (${importer.displayName})\n`);

    const result = await importer.run({ prisma, argv: providerArgs });
    printImportSummary(result.summary);

    if (!result.success) {
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
