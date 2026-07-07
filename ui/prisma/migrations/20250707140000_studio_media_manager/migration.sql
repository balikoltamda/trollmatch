-- Studio media manager — SHA-256, attribution, manufacturer logos

CREATE TYPE "manufacturer_image_role" AS ENUM ('LOGO');

ALTER TABLE "images"
  ADD COLUMN "source_url" VARCHAR(1024),
  ADD COLUMN "sha256_hash" CHAR(64),
  ADD COLUMN "credit_en" VARCHAR(512),
  ADD COLUMN "credit_tr" VARCHAR(512),
  ADD COLUMN "copyright_en" VARCHAR(512),
  ADD COLUMN "copyright_tr" VARCHAR(512);

CREATE INDEX "images_sha256_hash_idx" ON "images"("sha256_hash");

ALTER TABLE "species_images"
  ADD COLUMN "source_url" VARCHAR(1024),
  ADD COLUMN "sha256_hash" CHAR(64),
  ADD COLUMN "credit_en" VARCHAR(512),
  ADD COLUMN "credit_tr" VARCHAR(512),
  ADD COLUMN "copyright_en" VARCHAR(512),
  ADD COLUMN "copyright_tr" VARCHAR(512);

CREATE INDEX "species_images_sha256_hash_idx" ON "species_images"("sha256_hash");

CREATE TABLE "manufacturer_images" (
  "id" UUID NOT NULL,
  "manufacturer_id" UUID NOT NULL,
  "url" VARCHAR(1024) NOT NULL,
  "source_url" VARCHAR(1024),
  "sha256_hash" CHAR(64),
  "alt_text_en" VARCHAR(512),
  "alt_text_tr" VARCHAR(512),
  "credit_en" VARCHAR(512),
  "credit_tr" VARCHAR(512),
  "copyright_en" VARCHAR(512),
  "copyright_tr" VARCHAR(512),
  "role" "manufacturer_image_role" NOT NULL DEFAULT 'LOGO',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "deleted_at" TIMESTAMPTZ(6),

  CONSTRAINT "manufacturer_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "manufacturer_images_manufacturer_id_idx" ON "manufacturer_images"("manufacturer_id");
CREATE INDEX "manufacturer_images_role_idx" ON "manufacturer_images"("role");
CREATE INDEX "manufacturer_images_sha256_hash_idx" ON "manufacturer_images"("sha256_hash");
CREATE INDEX "manufacturer_images_deleted_at_idx" ON "manufacturer_images"("deleted_at");

ALTER TABLE "manufacturer_images"
  ADD CONSTRAINT "manufacturer_images_manufacturer_id_fkey"
  FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
