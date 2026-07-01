-- Sprint Foundation F001 — canonical product identity (Color, aliases, variant color FK)

-- CreateEnum
CREATE TYPE "product_alias_kind" AS ENUM ('DISPLAY_NAME', 'MODEL_CODE', 'MARKETING_NAME', 'SEARCH_TERM');

-- CreateEnum
CREATE TYPE "color_alias_kind" AS ENUM ('MANUFACTURER_CODE', 'MARKETING_NAME', 'SEARCH_TERM');

-- CreateTable
CREATE TABLE "colors" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "name_en" VARCHAR(256) NOT NULL,
    "name_tr" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "color_aliases" (
    "id" UUID NOT NULL,
    "color_id" UUID NOT NULL,
    "manufacturer_id" UUID,
    "manufacturer_scope" VARCHAR(36) NOT NULL DEFAULT 'platform',
    "locale" VARCHAR(8) NOT NULL DEFAULT 'any',
    "alias" VARCHAR(512) NOT NULL,
    "alias_normalized" VARCHAR(512) NOT NULL,
    "kind" "color_alias_kind" NOT NULL DEFAULT 'MANUFACTURER_CODE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "color_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_aliases" (
    "id" UUID NOT NULL,
    "lure_model_id" UUID NOT NULL,
    "manufacturer_id" UUID,
    "manufacturer_scope" VARCHAR(36) NOT NULL DEFAULT 'platform',
    "locale" VARCHAR(8) NOT NULL DEFAULT 'any',
    "alias" VARCHAR(512) NOT NULL,
    "alias_normalized" VARCHAR(512) NOT NULL,
    "kind" "product_alias_kind" NOT NULL DEFAULT 'DISPLAY_NAME',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "product_aliases_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "lure_variants" DROP COLUMN "color_code",
ADD COLUMN "color_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "colors_slug_key" ON "colors"("slug");

-- CreateIndex
CREATE INDEX "colors_deleted_at_idx" ON "colors"("deleted_at");

-- CreateIndex
CREATE INDEX "color_aliases_color_id_idx" ON "color_aliases"("color_id");

-- CreateIndex
CREATE INDEX "color_aliases_manufacturer_id_idx" ON "color_aliases"("manufacturer_id");

-- CreateIndex
CREATE INDEX "color_aliases_locale_idx" ON "color_aliases"("locale");

-- CreateIndex
CREATE INDEX "color_aliases_kind_idx" ON "color_aliases"("kind");

-- CreateIndex
CREATE INDEX "color_aliases_deleted_at_idx" ON "color_aliases"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "color_aliases_alias_normalized_locale_manufacturer_scope_key" ON "color_aliases"("alias_normalized", "locale", "manufacturer_scope");

-- CreateIndex
CREATE INDEX "product_aliases_lure_model_id_idx" ON "product_aliases"("lure_model_id");

-- CreateIndex
CREATE INDEX "product_aliases_manufacturer_id_idx" ON "product_aliases"("manufacturer_id");

-- CreateIndex
CREATE INDEX "product_aliases_locale_idx" ON "product_aliases"("locale");

-- CreateIndex
CREATE INDEX "product_aliases_kind_idx" ON "product_aliases"("kind");

-- CreateIndex
CREATE INDEX "product_aliases_deleted_at_idx" ON "product_aliases"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_aliases_alias_normalized_locale_manufacturer_scope_key" ON "product_aliases"("alias_normalized", "locale", "manufacturer_scope");

-- CreateIndex
CREATE INDEX "lure_variants_color_id_idx" ON "lure_variants"("color_id");

-- AddForeignKey
ALTER TABLE "lure_variants" ADD CONSTRAINT "lure_variants_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "color_aliases" ADD CONSTRAINT "color_aliases_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "color_aliases" ADD CONSTRAINT "color_aliases_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_aliases" ADD CONSTRAINT "product_aliases_lure_model_id_fkey" FOREIGN KEY ("lure_model_id") REFERENCES "lure_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_aliases" ADD CONSTRAINT "product_aliases_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
