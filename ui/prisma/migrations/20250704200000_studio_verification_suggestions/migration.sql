-- Sprint 6.2 — verification-first suggestions

CREATE TYPE "suggestion_source" AS ENUM (
  'IMPORTER',
  'AI_ENRICHMENT',
  'COMMUNITY_REPORT',
  'AI_SUMMARY',
  'EDITOR'
);

CREATE TYPE "suggestion_status" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'MERGED',
  'SUPERSEDED'
);

CREATE TYPE "suggestion_kind" AS ENUM (
  'FIELD_VALUE',
  'SPECIES_LINK',
  'TECHNIQUE_LINK',
  'EDITOR_NOTE',
  'IMAGE_COVER',
  'SUMMARY',
  'MERGE_CANDIDATE'
);

ALTER TYPE "catalog_audit_action" ADD VALUE IF NOT EXISTS 'SUGGESTION_APPROVE';
ALTER TYPE "catalog_audit_action" ADD VALUE IF NOT EXISTS 'SUGGESTION_REJECT';
ALTER TYPE "catalog_audit_action" ADD VALUE IF NOT EXISTS 'SUGGESTION_CORRECT';
ALTER TYPE "catalog_audit_action" ADD VALUE IF NOT EXISTS 'SUGGESTION_MERGE';

CREATE TABLE "catalog_suggestions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "lure_model_id" UUID NOT NULL,
  "kind" "suggestion_kind" NOT NULL DEFAULT 'FIELD_VALUE',
  "field_key" VARCHAR(64),
  "field_label" VARCHAR(128) NOT NULL,
  "current_value" TEXT,
  "suggested_value" TEXT,
  "confidence" "editor_note_confidence" NOT NULL DEFAULT 'MEDIUM',
  "source" "suggestion_source" NOT NULL,
  "reasoning" TEXT,
  "provenance" JSONB,
  "status" "suggestion_status" NOT NULL DEFAULT 'PENDING',
  "import_field_change_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMPTZ(6),
  "resolved_by" VARCHAR(128),

  CONSTRAINT "catalog_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "catalog_suggestions_import_field_change_id_key"
  ON "catalog_suggestions"("import_field_change_id");
CREATE INDEX "catalog_suggestions_lure_model_id_status_idx"
  ON "catalog_suggestions"("lure_model_id", "status");
CREATE INDEX "catalog_suggestions_source_status_idx"
  ON "catalog_suggestions"("source", "status");
CREATE INDEX "catalog_suggestions_created_at_idx"
  ON "catalog_suggestions"("created_at" DESC);

ALTER TABLE "catalog_suggestions"
  ADD CONSTRAINT "catalog_suggestions_lure_model_id_fkey"
  FOREIGN KEY ("lure_model_id") REFERENCES "lure_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "catalog_suggestions"
  ADD CONSTRAINT "catalog_suggestions_import_field_change_id_fkey"
  FOREIGN KEY ("import_field_change_id") REFERENCES "import_field_changes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
