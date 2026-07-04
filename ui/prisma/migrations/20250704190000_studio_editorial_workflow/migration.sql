-- Sprint 6.1 — editorial workflow: READY/ARCHIVED, expanded editor notes, import diffs

ALTER TYPE "content_lifecycle_state" ADD VALUE IF NOT EXISTS 'READY';
ALTER TYPE "content_lifecycle_state" ADD VALUE IF NOT EXISTS 'ARCHIVED';

CREATE TYPE "import_field_change_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

ALTER TYPE "catalog_audit_action" ADD VALUE IF NOT EXISTS 'IMPORT_DIFF';
ALTER TYPE "catalog_audit_action" ADD VALUE IF NOT EXISTS 'PUBLISH';
ALTER TYPE "catalog_audit_action" ADD VALUE IF NOT EXISTS 'UNPUBLISH';
ALTER TYPE "catalog_audit_action" ADD VALUE IF NOT EXISTS 'BULK_ACTION';

ALTER TABLE "lure_editor_notes"
  ADD COLUMN IF NOT EXISTS "current_recommendation_en" TEXT,
  ADD COLUMN IF NOT EXISTS "current_recommendation_tr" TEXT,
  ADD COLUMN IF NOT EXISTS "weather_en" TEXT,
  ADD COLUMN IF NOT EXISTS "weather_tr" TEXT,
  ADD COLUMN IF NOT EXISTS "water_clarity_en" TEXT,
  ADD COLUMN IF NOT EXISTS "water_clarity_tr" TEXT,
  ADD COLUMN IF NOT EXISTS "retrieve_speed_en" TEXT,
  ADD COLUMN IF NOT EXISTS "retrieve_speed_tr" TEXT,
  ADD COLUMN IF NOT EXISTS "best_target_species_en" TEXT,
  ADD COLUMN IF NOT EXISTS "best_target_species_tr" TEXT,
  ADD COLUMN IF NOT EXISTS "personal_observations_en" TEXT,
  ADD COLUMN IF NOT EXISTS "personal_observations_tr" TEXT;

CREATE TABLE "import_field_changes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "lure_model_id" UUID NOT NULL,
  "import_batch_id" UUID,
  "field_key" VARCHAR(64) NOT NULL,
  "field_label" VARCHAR(128) NOT NULL,
  "old_value" TEXT,
  "new_value" TEXT,
  "status" "import_field_change_status" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMPTZ(6),

  CONSTRAINT "import_field_changes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "import_field_changes_lure_model_id_status_idx"
  ON "import_field_changes"("lure_model_id", "status");
CREATE INDEX "import_field_changes_import_batch_id_idx"
  ON "import_field_changes"("import_batch_id");
CREATE INDEX "import_field_changes_created_at_idx"
  ON "import_field_changes"("created_at" DESC);

ALTER TABLE "import_field_changes"
  ADD CONSTRAINT "import_field_changes_lure_model_id_fkey"
  FOREIGN KEY ("lure_model_id") REFERENCES "lure_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "import_field_changes"
  ADD CONSTRAINT "import_field_changes_import_batch_id_fkey"
  FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
