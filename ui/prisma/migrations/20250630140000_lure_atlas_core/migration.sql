-- Sprint 2.1 — LureAtlas core catalog (replaces Sprint 1 platform_meta placeholder)

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "content_lifecycle_state" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'DEPRECATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "lure_species_association_kind" AS ENUM ('MANUFACTURER_MARKETING', 'MODERATOR_CURATED', 'COMMUNITY_EFFECTIVENESS');

-- CreateEnum
CREATE TYPE "image_role" AS ENUM ('HERO', 'PRODUCT', 'RIGGING_DIAGRAM', 'TECHNICAL_DIAGRAM');

-- CreateTable
CREATE TABLE "manufacturers" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "name_en" VARCHAR(256) NOT NULL,
    "name_tr" VARCHAR(256) NOT NULL,
    "country_code" CHAR(2),
    "website" VARCHAR(512),
    "logo_url" VARCHAR(1024),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_lines" (
    "id" UUID NOT NULL,
    "manufacturer_id" UUID NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "name_en" VARCHAR(256) NOT NULL,
    "name_tr" VARCHAR(256) NOT NULL,
    "description_en" TEXT,
    "description_tr" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "product_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lure_models" (
    "id" UUID NOT NULL,
    "manufacturer_id" UUID NOT NULL,
    "product_line_id" UUID NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "name_en" VARCHAR(256) NOT NULL,
    "name_tr" VARCHAR(256) NOT NULL,
    "form_factor_en" VARCHAR(128),
    "form_factor_tr" VARCHAR(128),
    "short_description_en" TEXT,
    "short_description_tr" TEXT,
    "lifecycle_state" "content_lifecycle_state" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "lure_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lure_variants" (
    "id" UUID NOT NULL,
    "lure_model_id" UUID NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "label_en" VARCHAR(256) NOT NULL,
    "label_tr" VARCHAR(256) NOT NULL,
    "length_mm" INTEGER,
    "weight_g" INTEGER,
    "color_code" VARCHAR(64),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "lure_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" UUID NOT NULL,
    "lure_model_id" UUID NOT NULL,
    "lure_variant_id" UUID,
    "url" VARCHAR(1024) NOT NULL,
    "alt_text_en" VARCHAR(512),
    "alt_text_tr" VARCHAR(512),
    "role" "image_role" NOT NULL DEFAULT 'PRODUCT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fish_species" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "scientific_name" VARCHAR(256) NOT NULL,
    "name_en" VARCHAR(256) NOT NULL,
    "name_tr" VARCHAR(256) NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "fish_species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "techniques" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "name_en" VARCHAR(256) NOT NULL,
    "name_tr" VARCHAR(256) NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lure_techniques" (
    "id" UUID NOT NULL,
    "lure_model_id" UUID NOT NULL,
    "technique_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "lure_techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lure_species" (
    "id" UUID NOT NULL,
    "lure_model_id" UUID NOT NULL,
    "fish_species_id" UUID NOT NULL,
    "association_kind" "lure_species_association_kind" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "lure_species_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_slug_key" ON "manufacturers"("slug");

-- CreateIndex
CREATE INDEX "manufacturers_deleted_at_idx" ON "manufacturers"("deleted_at");

-- CreateIndex
CREATE INDEX "product_lines_manufacturer_id_idx" ON "product_lines"("manufacturer_id");

-- CreateIndex
CREATE INDEX "product_lines_deleted_at_idx" ON "product_lines"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_lines_manufacturer_id_slug_key" ON "product_lines"("manufacturer_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "lure_models_slug_key" ON "lure_models"("slug");

-- CreateIndex
CREATE INDEX "lure_models_manufacturer_id_idx" ON "lure_models"("manufacturer_id");

-- CreateIndex
CREATE INDEX "lure_models_product_line_id_idx" ON "lure_models"("product_line_id");

-- CreateIndex
CREATE INDEX "lure_models_lifecycle_state_idx" ON "lure_models"("lifecycle_state");

-- CreateIndex
CREATE INDEX "lure_models_deleted_at_idx" ON "lure_models"("deleted_at");

-- CreateIndex
CREATE INDEX "lure_variants_lure_model_id_idx" ON "lure_variants"("lure_model_id");

-- CreateIndex
CREATE INDEX "lure_variants_deleted_at_idx" ON "lure_variants"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "lure_variants_lure_model_id_slug_key" ON "lure_variants"("lure_model_id", "slug");

-- CreateIndex
CREATE INDEX "images_lure_model_id_idx" ON "images"("lure_model_id");

-- CreateIndex
CREATE INDEX "images_lure_variant_id_idx" ON "images"("lure_variant_id");

-- CreateIndex
CREATE INDEX "images_deleted_at_idx" ON "images"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "fish_species_slug_key" ON "fish_species"("slug");

-- CreateIndex
CREATE INDEX "fish_species_parent_id_idx" ON "fish_species"("parent_id");

-- CreateIndex
CREATE INDEX "fish_species_deleted_at_idx" ON "fish_species"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "techniques_slug_key" ON "techniques"("slug");

-- CreateIndex
CREATE INDEX "techniques_parent_id_idx" ON "techniques"("parent_id");

-- CreateIndex
CREATE INDEX "techniques_deleted_at_idx" ON "techniques"("deleted_at");

-- CreateIndex
CREATE INDEX "lure_techniques_lure_model_id_idx" ON "lure_techniques"("lure_model_id");

-- CreateIndex
CREATE INDEX "lure_techniques_technique_id_idx" ON "lure_techniques"("technique_id");

-- CreateIndex
CREATE INDEX "lure_techniques_deleted_at_idx" ON "lure_techniques"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "lure_techniques_lure_model_id_technique_id_key" ON "lure_techniques"("lure_model_id", "technique_id");

-- CreateIndex
CREATE INDEX "lure_species_lure_model_id_idx" ON "lure_species"("lure_model_id");

-- CreateIndex
CREATE INDEX "lure_species_fish_species_id_idx" ON "lure_species"("fish_species_id");

-- CreateIndex
CREATE INDEX "lure_species_association_kind_idx" ON "lure_species"("association_kind");

-- CreateIndex
CREATE INDEX "lure_species_deleted_at_idx" ON "lure_species"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "lure_species_lure_model_id_fish_species_id_association_kind_key" ON "lure_species"("lure_model_id", "fish_species_id", "association_kind");

-- AddForeignKey
ALTER TABLE "product_lines" ADD CONSTRAINT "product_lines_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lure_models" ADD CONSTRAINT "lure_models_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lure_models" ADD CONSTRAINT "lure_models_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lure_variants" ADD CONSTRAINT "lure_variants_lure_model_id_fkey" FOREIGN KEY ("lure_model_id") REFERENCES "lure_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_lure_model_id_fkey" FOREIGN KEY ("lure_model_id") REFERENCES "lure_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_lure_variant_id_fkey" FOREIGN KEY ("lure_variant_id") REFERENCES "lure_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fish_species" ADD CONSTRAINT "fish_species_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "fish_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "techniques" ADD CONSTRAINT "techniques_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "techniques"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lure_techniques" ADD CONSTRAINT "lure_techniques_lure_model_id_fkey" FOREIGN KEY ("lure_model_id") REFERENCES "lure_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lure_techniques" ADD CONSTRAINT "lure_techniques_technique_id_fkey" FOREIGN KEY ("technique_id") REFERENCES "techniques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lure_species" ADD CONSTRAINT "lure_species_lure_model_id_fkey" FOREIGN KEY ("lure_model_id") REFERENCES "lure_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lure_species" ADD CONSTRAINT "lure_species_fish_species_id_fkey" FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
