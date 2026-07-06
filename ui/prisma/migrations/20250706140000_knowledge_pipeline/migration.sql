-- Sprint 7.4 — Knowledge Acquisition Pipeline

CREATE TYPE "knowledge_source_type" AS ENUM (
  'MANUFACTURER',
  'COMMUNITY',
  'YOUTUBE',
  'FISHING_FORUM',
  'PUBLIC_ARTICLE',
  'SCIENTIFIC_PUBLICATION',
  'OTHER'
);

CREATE TYPE "knowledge_item_status" AS ENUM (
  'DISCOVERED',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'MERGED',
  'IGNORED',
  'DUPLICATE'
);

CREATE TYPE "knowledge_editor_decision" AS ENUM (
  'NONE',
  'APPROVED',
  'REJECTED',
  'MERGED',
  'IGNORED'
);

CREATE TYPE "knowledge_confidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TYPE "knowledge_audit_action" AS ENUM (
  'APPROVE',
  'REJECT',
  'MERGE',
  'IGNORE',
  'OPEN_SOURCE'
);

CREATE TYPE "knowledge_graph_entity_type" AS ENUM (
  'SPECIES',
  'LURE_MODEL',
  'MANUFACTURER',
  'TECHNIQUE',
  'KNOWLEDGE_ITEM'
);

CREATE TYPE "knowledge_graph_relation_kind" AS ENUM (
  'MENTIONS',
  'SUPPORTS',
  'CONFLICTS_WITH',
  'DUPLICATE_OF',
  'RELATED_TO'
);

CREATE TABLE "knowledge_sources" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "source_type" "knowledge_source_type" NOT NULL,
    "name_en" VARCHAR(256) NOT NULL,
    "name_tr" VARCHAR(256) NOT NULL,
    "base_url" VARCHAR(1024),
    "trust_tier" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "knowledge_sources_slug_key" ON "knowledge_sources"("slug");
CREATE INDEX "knowledge_sources_source_type_idx" ON "knowledge_sources"("source_type");
CREATE INDEX "knowledge_sources_active_idx" ON "knowledge_sources"("active");

CREATE TABLE "knowledge_items" (
    "id" UUID NOT NULL,
    "knowledge_source_id" UUID NOT NULL,
    "external_key" VARCHAR(256),
    "url" VARCHAR(2048) NOT NULL,
    "title_en" VARCHAR(512),
    "title_tr" VARCHAR(512),
    "raw_snippet_en" TEXT,
    "raw_snippet_tr" TEXT,
    "discovered_at" TIMESTAMPTZ(6) NOT NULL,
    "confidence" "knowledge_confidence" NOT NULL DEFAULT 'MEDIUM',
    "status" "knowledge_item_status" NOT NULL DEFAULT 'PENDING_REVIEW',
    "editor_decision" "knowledge_editor_decision" NOT NULL DEFAULT 'NONE',
    "ai_summary_en" TEXT,
    "ai_summary_tr" TEXT,
    "country" CHAR(2),
    "region" VARCHAR(128),
    "fish_species_id" UUID,
    "lure_model_id" UUID,
    "technique_id" UUID,
    "manufacturer_id" UUID,
    "merged_into_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" VARCHAR(128),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "knowledge_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "knowledge_items_status_confidence_discovered_at_idx" ON "knowledge_items"("status", "confidence", "discovered_at" DESC);
CREATE INDEX "knowledge_items_knowledge_source_id_idx" ON "knowledge_items"("knowledge_source_id");
CREATE INDEX "knowledge_items_fish_species_id_idx" ON "knowledge_items"("fish_species_id");
CREATE INDEX "knowledge_items_lure_model_id_idx" ON "knowledge_items"("lure_model_id");
CREATE INDEX "knowledge_items_merged_into_id_idx" ON "knowledge_items"("merged_into_id");

CREATE TABLE "knowledge_evidence" (
    "id" UUID NOT NULL,
    "knowledge_item_id" UUID NOT NULL,
    "label" VARCHAR(256) NOT NULL,
    "excerpt_en" TEXT NOT NULL,
    "excerpt_tr" TEXT,
    "source_url" VARCHAR(2048),
    "confidence" "knowledge_confidence",
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "knowledge_evidence_knowledge_item_id_idx" ON "knowledge_evidence"("knowledge_item_id");

CREATE TABLE "knowledge_suggestions" (
    "id" UUID NOT NULL,
    "knowledge_item_id" UUID NOT NULL,
    "kind" VARCHAR(64) NOT NULL,
    "proposed_value_en" TEXT,
    "proposed_value_tr" TEXT,
    "target_entity_type" VARCHAR(64),
    "target_entity_id" UUID,
    "status" "knowledge_item_status" NOT NULL DEFAULT 'PENDING_REVIEW',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "knowledge_suggestions_knowledge_item_id_idx" ON "knowledge_suggestions"("knowledge_item_id");
CREATE INDEX "knowledge_suggestions_status_idx" ON "knowledge_suggestions"("status");

CREATE TABLE "knowledge_graph_links" (
    "id" UUID NOT NULL,
    "knowledge_item_id" UUID NOT NULL,
    "entity_type" "knowledge_graph_entity_type" NOT NULL,
    "entity_id" UUID NOT NULL,
    "relation_kind" "knowledge_graph_relation_kind" NOT NULL,
    "weight" DECIMAL(4,3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_graph_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "knowledge_graph_links_knowledge_item_id_idx" ON "knowledge_graph_links"("knowledge_item_id");
CREATE INDEX "knowledge_graph_links_entity_type_entity_id_idx" ON "knowledge_graph_links"("entity_type", "entity_id");

CREATE TABLE "knowledge_audit_entries" (
    "id" UUID NOT NULL,
    "knowledge_item_id" UUID,
    "action" "knowledge_audit_action" NOT NULL,
    "actor" VARCHAR(128) NOT NULL DEFAULT 'local-admin',
    "summary" VARCHAR(512) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_audit_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "knowledge_audit_entries_knowledge_item_id_created_at_idx" ON "knowledge_audit_entries"("knowledge_item_id", "created_at" DESC);
CREATE INDEX "knowledge_audit_entries_action_idx" ON "knowledge_audit_entries"("action");

ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_knowledge_source_id_fkey" FOREIGN KEY ("knowledge_source_id") REFERENCES "knowledge_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_fish_species_id_fkey" FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_lure_model_id_fkey" FOREIGN KEY ("lure_model_id") REFERENCES "lure_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_technique_id_fkey" FOREIGN KEY ("technique_id") REFERENCES "techniques"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_merged_into_id_fkey" FOREIGN KEY ("merged_into_id") REFERENCES "knowledge_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "knowledge_evidence" ADD CONSTRAINT "knowledge_evidence_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "knowledge_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_suggestions" ADD CONSTRAINT "knowledge_suggestions_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "knowledge_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_graph_links" ADD CONSTRAINT "knowledge_graph_links_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "knowledge_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_audit_entries" ADD CONSTRAINT "knowledge_audit_entries_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "knowledge_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
