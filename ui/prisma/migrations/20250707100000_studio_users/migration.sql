-- Studio authentication users (manual provisioning — no self-registration)

CREATE TYPE "studio_role" AS ENUM ('ADMIN', 'EDITOR', 'MODERATOR');

CREATE TABLE "studio_users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(128),
    "role" "studio_role" NOT NULL DEFAULT 'EDITOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "studio_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "studio_users_email_key" ON "studio_users"("email");
