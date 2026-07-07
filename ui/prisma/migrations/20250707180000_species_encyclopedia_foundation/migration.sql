-- Bilingual slugs for species pages
ALTER TABLE "fish_species" ADD COLUMN "slug_en" VARCHAR(128);
ALTER TABLE "fish_species" ADD COLUMN "slug_tr" VARCHAR(128);

UPDATE "fish_species" SET "slug_en" = "slug", "slug_tr" = "slug";

ALTER TABLE "fish_species" ALTER COLUMN "slug_en" SET NOT NULL;
ALTER TABLE "fish_species" ALTER COLUMN "slug_tr" SET NOT NULL;

CREATE UNIQUE INDEX "fish_species_slug_en_key" ON "fish_species"("slug_en");
CREATE UNIQUE INDEX "fish_species_slug_tr_key" ON "fish_species"("slug_tr");

-- Species distribution regions (M2M with regions table)
CREATE TABLE "fish_species_regions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fish_species_id" UUID NOT NULL,
    "region_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fish_species_regions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fish_species_regions_fish_species_id_region_id_key" ON "fish_species_regions"("fish_species_id", "region_id");
CREATE INDEX "fish_species_regions_fish_species_id_idx" ON "fish_species_regions"("fish_species_id");
CREATE INDEX "fish_species_regions_region_id_idx" ON "fish_species_regions"("region_id");

ALTER TABLE "fish_species_regions" ADD CONSTRAINT "fish_species_regions_fish_species_id_fkey" FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fish_species_regions" ADD CONSTRAINT "fish_species_regions_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Image photographer credits
ALTER TABLE "species_images" ADD COLUMN "photographer_en" VARCHAR(512);
ALTER TABLE "species_images" ADD COLUMN "photographer_tr" VARCHAR(512);

-- Align region codes with Version 1 encyclopedia constants
UPDATE "regions" SET "code" = 'MARMARA' WHERE "code" = 'SEA_OF_MARMARA';
UPDATE "regions" SET "code" = 'AEGEAN' WHERE "code" = 'AEGEAN_SEA';
UPDATE "regions" SET "code" = 'TURKISH_MEDITERRANEAN' WHERE "code" = 'TR_MEDITERRANEAN';
