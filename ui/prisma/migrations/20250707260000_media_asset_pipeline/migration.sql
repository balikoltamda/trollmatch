-- Sprint 7.9 — Media Asset Pipeline: canonical managed assets + optimized variants.

CREATE TYPE "media_asset_variant_kind" AS ENUM (
  'ORIGINAL',
  'LARGE',
  'MEDIUM',
  'THUMBNAIL',
  'WEBP'
);

CREATE TABLE "media_assets" (
  "id" UUID NOT NULL,
  "sha256_hash" CHAR(64) NOT NULL,
  "original_url" VARCHAR(1024),
  "mime_type" VARCHAR(128) NOT NULL,
  "width_px" INTEGER,
  "height_px" INTEGER,
  "size_bytes" INTEGER NOT NULL,
  "imported_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "manufacturer_id" UUID,
  "credit_en" VARCHAR(512),
  "credit_tr" VARCHAR(512),
  "photographer_en" VARCHAR(512),
  "photographer_tr" VARCHAR(512),
  "copyright_en" VARCHAR(512),
  "copyright_tr" VARCHAR(512),
  "license_note_en" VARCHAR(512),
  "license_note_tr" VARCHAR(512),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "media_asset_variants" (
  "id" UUID NOT NULL,
  "media_asset_id" UUID NOT NULL,
  "kind" "media_asset_variant_kind" NOT NULL,
  "public_path" VARCHAR(1024) NOT NULL,
  "mime_type" VARCHAR(128) NOT NULL,
  "width_px" INTEGER,
  "height_px" INTEGER,
  "size_bytes" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "media_asset_variants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_assets_sha256_hash_key" ON "media_assets"("sha256_hash");
CREATE INDEX "media_assets_manufacturer_id_idx" ON "media_assets"("manufacturer_id");
CREATE INDEX "media_assets_imported_at_idx" ON "media_assets"("imported_at");

CREATE UNIQUE INDEX "media_asset_variants_media_asset_id_kind_key"
  ON "media_asset_variants"("media_asset_id", "kind");
CREATE INDEX "media_asset_variants_media_asset_id_idx"
  ON "media_asset_variants"("media_asset_id");

ALTER TABLE "media_assets"
  ADD CONSTRAINT "media_assets_manufacturer_id_fkey"
  FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "media_asset_variants"
  ADD CONSTRAINT "media_asset_variants_media_asset_id_fkey"
  FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "images" ADD COLUMN "media_asset_id" UUID;
ALTER TABLE "species_images" ADD COLUMN "media_asset_id" UUID;
ALTER TABLE "manufacturer_images" ADD COLUMN "media_asset_id" UUID;
ALTER TABLE "technology_images" ADD COLUMN "media_asset_id" UUID;

CREATE INDEX "images_media_asset_id_idx" ON "images"("media_asset_id");
CREATE INDEX "species_images_media_asset_id_idx" ON "species_images"("media_asset_id");
CREATE INDEX "manufacturer_images_media_asset_id_idx" ON "manufacturer_images"("media_asset_id");
CREATE INDEX "technology_images_media_asset_id_idx" ON "technology_images"("media_asset_id");

ALTER TABLE "images"
  ADD CONSTRAINT "images_media_asset_id_fkey"
  FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "species_images"
  ADD CONSTRAINT "species_images_media_asset_id_fkey"
  FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "manufacturer_images"
  ADD CONSTRAINT "manufacturer_images_media_asset_id_fkey"
  FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "technology_images"
  ADD CONSTRAINT "technology_images_media_asset_id_fkey"
  FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
