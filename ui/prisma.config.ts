import { loadEnv } from "./src/lib/load-env";
import { defineConfig } from "prisma/config";

loadEnv({ cwd: import.meta.dirname });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
