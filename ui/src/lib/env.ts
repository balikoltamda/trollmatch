import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
  });
}

export function getClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  });
}
