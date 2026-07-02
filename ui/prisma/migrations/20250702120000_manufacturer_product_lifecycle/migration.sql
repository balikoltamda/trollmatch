-- Sprint S014 — Manufacturer product lifecycle tracking on lure_models

CREATE TYPE "manufacturer_product_status" AS ENUM ('ACTIVE', 'MISSING', 'DISCONTINUED', 'UNKNOWN');

ALTER TABLE "lure_models"
  ADD COLUMN "first_seen_at" TIMESTAMPTZ(6),
  ADD COLUMN "last_seen_at" TIMESTAMPTZ(6),
  ADD COLUMN "last_imported_at" TIMESTAMPTZ(6),
  ADD COLUMN "missing_import_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "manufacturer_status" "manufacturer_product_status" NOT NULL DEFAULT 'UNKNOWN';

CREATE INDEX "lure_models_manufacturer_status_idx" ON "lure_models"("manufacturer_status");
