import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads environment files in the same precedence order as Next.js:
 * .env → .env.local → .env.[NODE_ENV] → .env.[NODE_ENV].local
 *
 * Later files override earlier ones. Used by Prisma CLI and db scripts.
 */
export function loadEnv(options: { cwd?: string } = {}): void {
  const cwd = options.cwd ?? process.cwd();
  const nodeEnv = process.env.NODE_ENV ?? "development";

  const files = [
    ".env",
    ".env.local",
    `.env.${nodeEnv}`,
    `.env.${nodeEnv}.local`,
  ];

  for (const file of files) {
    const path = resolve(cwd, file);

    if (existsSync(path)) {
      config({ path, override: true, quiet: true });
    }
  }
}
