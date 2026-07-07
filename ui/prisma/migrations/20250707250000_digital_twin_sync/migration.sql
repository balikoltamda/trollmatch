-- Sprint 7.8 — Digital Twin Product Synchronization

CREATE TYPE "digital_twin_sync_status" AS ENUM (
  'NEVER_SYNCED',
  'SYNCED',
  'STALE',
  'CHANGES_PENDING',
  'CHECK_FAILED'
);

CREATE TYPE "import_field_change_kind" AS ENUM (
  'ADDED',
  'UPDATED',
  'REMOVED',
  'UNCHANGED'
);

ALTER TYPE "image_role" ADD VALUE IF NOT EXISTS 'GALLERY';
ALTER TYPE "image_role" ADD VALUE IF NOT EXISTS 'PACKAGING';
ALTER TYPE "image_role" ADD VALUE IF NOT EXISTS 'TECHNOLOGY';
ALTER TYPE "image_role" ADD VALUE IF NOT EXISTS 'HOOK_DETAIL';
ALTER TYPE "image_role" ADD VALUE IF NOT EXISTS 'SPLIT_RING_DETAIL';
ALTER TYPE "image_role" ADD VALUE IF NOT EXISTS 'COLOR_CARD';
ALTER TYPE "image_role" ADD VALUE IF NOT EXISTS 'ACTION_DIAGRAM';
ALTER TYPE "image_role" ADD VALUE IF NOT EXISTS 'UNKNOWN';

ALTER TABLE "lure_models" ADD COLUMN "seo_title_en" VARCHAR(256);
ALTER TABLE "lure_models" ADD COLUMN "seo_title_tr" VARCHAR(256);
ALTER TABLE "lure_models" ADD COLUMN "meta_description_en" TEXT;
ALTER TABLE "lure_models" ADD COLUMN "meta_description_tr" TEXT;
ALTER TABLE "lure_models" ADD COLUMN "open_graph_title_en" VARCHAR(256);
ALTER TABLE "lure_models" ADD COLUMN "open_graph_title_tr" VARCHAR(256);
ALTER TABLE "lure_models" ADD COLUMN "open_graph_description_en" TEXT;
ALTER TABLE "lure_models" ADD COLUMN "open_graph_description_tr" TEXT;
ALTER TABLE "lure_models" ADD COLUMN "manufacturer_url" VARCHAR(1024);
ALTER TABLE "lure_models" ADD COLUMN "last_manufacturer_sync_at" TIMESTAMPTZ(6);
ALTER TABLE "lure_models" ADD COLUMN "last_manufacturer_check_at" TIMESTAMPTZ(6);
ALTER TABLE "lure_models" ADD COLUMN "last_successful_import_at" TIMESTAMPTZ(6);
ALTER TABLE "lure_models" ADD COLUMN "manufacturer_version_hash" CHAR(64);
ALTER TABLE "lure_models" ADD COLUMN "content_hash" CHAR(64);
ALTER TABLE "lure_models" ADD COLUMN "image_hash" CHAR(64);
ALTER TABLE "lure_models" ADD COLUMN "technology_hash" CHAR(64);
ALTER TABLE "lure_models" ADD COLUMN "specification_hash" CHAR(64);
ALTER TABLE "lure_models" ADD COLUMN "sync_status" "digital_twin_sync_status" NOT NULL DEFAULT 'NEVER_SYNCED';

ALTER TABLE "import_field_changes" ADD COLUMN "edited_value" TEXT;
ALTER TABLE "import_field_changes" ADD COLUMN "change_kind" "import_field_change_kind" NOT NULL DEFAULT 'ADDED';

ALTER TABLE "manufacturer_technologies" ADD COLUMN "patent_note" TEXT;
ALTER TABLE "manufacturer_technologies" ADD COLUMN "image_url" VARCHAR(1024);

CREATE TABLE "technology_images" (
  "id" UUID NOT NULL,
  "technology_id" UUID NOT NULL,
  "url" VARCHAR(1024) NOT NULL,
  "alt_text_en" VARCHAR(512),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "technology_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "technology_images_technology_id_idx" ON "technology_images"("technology_id");

ALTER TABLE "technology_images"
  ADD CONSTRAINT "technology_images_technology_id_fkey"
  FOREIGN KEY ("technology_id") REFERENCES "manufacturer_technologies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
