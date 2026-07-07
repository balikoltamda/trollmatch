/**
 * Create a Studio user with a bcrypt-hashed password.
 *
 * Usage (from repo root):
 *   npx tsx ui/scripts/create-studio-user.ts --email admin@example.com --password secret --role ADMIN
 */
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, type StudioRole } from "../src/generated/prisma/client";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const email = readArg("--email")?.trim().toLowerCase();
  const password = readArg("--password");
  const role = (readArg("--role")?.toUpperCase() ?? "EDITOR") as StudioRole;
  const name = readArg("--name");

  if (!email || !password) {
    console.error(
      "Usage: npx tsx ui/scripts/create-studio-user.ts --email <email> --password <password> [--role ADMIN|EDITOR|MODERATOR] [--name \"Display name\"]",
    );
    process.exit(1);
  }

  if (!["ADMIN", "EDITOR", "MODERATOR"].includes(role)) {
    console.error("Invalid role. Use ADMIN, EDITOR, or MODERATOR.");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const passwordHash = await hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        name: name ?? null,
        role,
      },
      update: {
        passwordHash,
        name: name ?? null,
        role,
        isActive: true,
      },
    });

    console.log(`Studio user ready: ${user.email} (${user.role})`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
