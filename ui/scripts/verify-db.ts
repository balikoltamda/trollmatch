import { resolve } from "node:path";
import { loadEnv } from "../src/lib/load-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ cwd: resolve(import.meta.dirname, "..") });

async function verifyDatabaseConnection(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      "FAIL: DATABASE_URL is not set. Add it to ui/.env.local (see ui/.env.example).",
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;

    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const migrations = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name
      FROM _prisma_migrations
      ORDER BY finished_at
    `.catch(() => [] as { migration_name: string }[]);

    console.log("OK: PostgreSQL connection successful");
    console.log(`OK: ${tables.length} public table(s) found`);

    if (tables.length > 0) {
      console.log(`    tables: ${tables.map((t) => t.table_name).join(", ")}`);
    }

    if (migrations.length > 0) {
      console.log(`OK: ${migrations.length} migration(s) applied`);
      console.log(
        `    latest: ${migrations[migrations.length - 1]?.migration_name}`,
      );
    } else {
      console.warn(
        "WARN: No Prisma migrations recorded — run npm run db:migrate",
      );
    }
  } catch (error) {
    console.error("FAIL: Database verification failed");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void verifyDatabaseConnection();
