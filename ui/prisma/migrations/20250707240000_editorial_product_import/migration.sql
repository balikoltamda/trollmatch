-- Sprint 7.7 — Editorial Product Import Pipeline

CREATE TABLE "manufacturer_technologies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "manufacturer_id" UUID NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "name_en" VARCHAR(256) NOT NULL,
    "description_en" TEXT,
    "description_tr" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturer_technologies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "manufacturer_technologies_manufacturer_id_slug_key"
  ON "manufacturer_technologies"("manufacturer_id", "slug");

CREATE INDEX "manufacturer_technologies_manufacturer_id_idx"
  ON "manufacturer_technologies"("manufacturer_id");

CREATE TABLE "lure_model_technologies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lure_model_id" UUID NOT NULL,
    "technology_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lure_model_technologies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lure_model_technologies_lure_model_id_technology_id_key"
  ON "lure_model_technologies"("lure_model_id", "technology_id");

CREATE INDEX "lure_model_technologies_lure_model_id_idx"
  ON "lure_model_technologies"("lure_model_id");

CREATE INDEX "lure_model_technologies_technology_id_idx"
  ON "lure_model_technologies"("technology_id");

ALTER TABLE "lure_models"
  ADD COLUMN IF NOT EXISTS "import_spec_metadata" JSONB;

ALTER TABLE "manufacturer_technologies"
  ADD CONSTRAINT "manufacturer_technologies_manufacturer_id_fkey"
  FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lure_model_technologies"
  ADD CONSTRAINT "lure_model_technologies_lure_model_id_fkey"
  FOREIGN KEY ("lure_model_id") REFERENCES "lure_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lure_model_technologies"
  ADD CONSTRAINT "lure_model_technologies_technology_id_fkey"
  FOREIGN KEY ("technology_id") REFERENCES "manufacturer_technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
