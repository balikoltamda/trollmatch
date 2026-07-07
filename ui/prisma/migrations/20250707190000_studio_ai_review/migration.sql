-- Studio AI Review workflow (Sprint 7.6D)
CREATE TYPE "studio_review_entity_type" AS ENUM (
  'SPECIES',
  'TECHNIQUE',
  'MANUFACTURER',
  'LURE',
  'KNOWLEDGE_SOURCE'
);

CREATE TABLE "studio_ai_review_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" "studio_review_entity_type" NOT NULL,
    "entity_id" UUID,
    "seed_input" JSONB NOT NULL,
    "created_by" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_ai_review_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "studio_ai_review_sessions_entity_type_entity_id_idx" ON "studio_ai_review_sessions"("entity_type", "entity_id");
CREATE INDEX "studio_ai_review_sessions_created_at_idx" ON "studio_ai_review_sessions"("created_at" DESC);

CREATE TABLE "studio_ai_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "entity_type" "studio_review_entity_type" NOT NULL,
    "entity_id" UUID,
    "field_key" VARCHAR(64) NOT NULL,
    "field_label" VARCHAR(128) NOT NULL,
    "suggested_value" TEXT NOT NULL,
    "current_value" TEXT,
    "confidence_pct" INTEGER NOT NULL,
    "source" "suggestion_source" NOT NULL,
    "reasoning" TEXT NOT NULL,
    "status" "suggestion_status" NOT NULL DEFAULT 'PENDING',
    "edited_value" TEXT,
    "provenance" JSONB,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" VARCHAR(128),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_ai_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "studio_ai_suggestions_session_id_status_idx" ON "studio_ai_suggestions"("session_id", "status");
CREATE INDEX "studio_ai_suggestions_entity_type_entity_id_status_idx" ON "studio_ai_suggestions"("entity_type", "entity_id", "status");

ALTER TABLE "studio_ai_suggestions" ADD CONSTRAINT "studio_ai_suggestions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "studio_ai_review_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "catalog_audit_action" ADD VALUE 'AI_SUGGESTION_ACCEPT';
ALTER TYPE "catalog_audit_action" ADD VALUE 'AI_SUGGESTION_REJECT';
