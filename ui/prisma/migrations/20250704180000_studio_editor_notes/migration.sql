-- CreateEnum
CREATE TYPE "editor_note_confidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "import_batch_status" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "catalog_audit_action" AS ENUM ('IMPORT_BATCH', 'IMPORT_CREATE', 'IMPORT_UPDATE', 'EDITOR_CANONICAL', 'EDITOR_NOTES', 'LIFECYCLE_CHANGE');

-- CreateTable
CREATE TABLE "lure_editor_notes" (
    "id" UUID NOT NULL,
    "lure_model_id" UUID NOT NULL,
    "short_recommendation_en" TEXT,
    "short_recommendation_tr" TEXT,
    "long_recommendation_en" TEXT,
    "long_recommendation_tr" TEXT,
    "mediterranean_notes_en" TEXT,
    "mediterranean_notes_tr" TEXT,
    "aegean_notes_en" TEXT,
    "aegean_notes_tr" TEXT,
    "northern_cyprus_notes_en" TEXT,
    "northern_cyprus_notes_tr" TEXT,
    "seasonality_en" TEXT,
    "seasonality_tr" TEXT,
    "recommended_retrieve_en" TEXT,
    "recommended_retrieve_tr" TEXT,
    "warnings_en" TEXT,
    "warnings_tr" TEXT,
    "best_colors_en" TEXT,
    "best_colors_tr" TEXT,
    "confidence" "editor_note_confidence" NOT NULL DEFAULT 'MEDIUM',
    "internal_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lure_editor_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" UUID NOT NULL,
    "manufacturer_id" UUID,
    "manufacturer_code" VARCHAR(64) NOT NULL,
    "display_name" VARCHAR(128) NOT NULL,
    "status" "import_batch_status" NOT NULL DEFAULT 'RUNNING',
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "duration_ms" INTEGER,
    "products_processed" INTEGER NOT NULL DEFAULT 0,
    "created_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "removed_count" INTEGER NOT NULL DEFAULT 0,
    "missing_count" INTEGER NOT NULL DEFAULT 0,
    "warning_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "report_path" VARCHAR(1024),
    "report_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_audit_entries" (
    "id" UUID NOT NULL,
    "lure_model_id" UUID,
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "catalog_audit_action" NOT NULL,
    "actor" VARCHAR(128) NOT NULL DEFAULT 'local-admin',
    "summary" VARCHAR(512) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lure_editor_notes_lure_model_id_key" ON "lure_editor_notes"("lure_model_id");

-- CreateIndex
CREATE INDEX "import_batches_manufacturer_code_idx" ON "import_batches"("manufacturer_code");

-- CreateIndex
CREATE INDEX "import_batches_manufacturer_id_idx" ON "import_batches"("manufacturer_id");

-- CreateIndex
CREATE INDEX "import_batches_started_at_idx" ON "import_batches"("started_at" DESC);

-- CreateIndex
CREATE INDEX "import_batches_status_idx" ON "import_batches"("status");

-- CreateIndex
CREATE INDEX "catalog_audit_entries_lure_model_id_created_at_idx" ON "catalog_audit_entries"("lure_model_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "catalog_audit_entries_action_idx" ON "catalog_audit_entries"("action");

-- CreateIndex
CREATE INDEX "catalog_audit_entries_created_at_idx" ON "catalog_audit_entries"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "lure_editor_notes" ADD CONSTRAINT "lure_editor_notes_lure_model_id_fkey" FOREIGN KEY ("lure_model_id") REFERENCES "lure_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_audit_entries" ADD CONSTRAINT "catalog_audit_entries_lure_model_id_fkey" FOREIGN KEY ("lure_model_id") REFERENCES "lure_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
