-- SpeciesCompass profile extension (Sprint 7.6 prep)

CREATE TYPE "iucn_red_list_status" AS ENUM (
  'LC',
  'NT',
  'VU',
  'EN',
  'CR',
  'DD',
  'NE',
  'EW',
  'EX'
);

CREATE TYPE "species_image_role" AS ENUM ('HERO', 'GALLERY');

CREATE TABLE "species_profiles" (
  "id" UUID NOT NULL,
  "fish_species_id" UUID NOT NULL,
  "description_en" TEXT,
  "description_tr" TEXT,
  "habitat_en" TEXT,
  "habitat_tr" TEXT,
  "distribution_en" TEXT,
  "distribution_tr" TEXT,
  "depth_min_m" DECIMAL(6, 2),
  "depth_max_m" DECIMAL(6, 2),
  "spawning_en" TEXT,
  "spawning_tr" TEXT,
  "max_length_cm" DECIMAL(8, 2),
  "max_weight_g" DECIMAL(10, 2),
  "conservation_en" TEXT,
  "conservation_tr" TEXT,
  "fao_areas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "iucn_status" "iucn_red_list_status",
  "lifecycle_state" "content_lifecycle_state" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "species_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "species_classifications" (
  "id" UUID NOT NULL,
  "fish_species_id" UUID NOT NULL,
  "kingdom" VARCHAR(128),
  "phylum" VARCHAR(128),
  "class_name" VARCHAR(128),
  "order_name" VARCHAR(128),
  "family" VARCHAR(128),
  "genus" VARCHAR(128),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "species_classifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "species_editor_notes" (
  "id" UUID NOT NULL,
  "fish_species_id" UUID NOT NULL,
  "mediterranean_notes_en" TEXT,
  "mediterranean_notes_tr" TEXT,
  "aegean_notes_en" TEXT,
  "aegean_notes_tr" TEXT,
  "northern_cyprus_notes_en" TEXT,
  "northern_cyprus_notes_tr" TEXT,
  "confidence" "editor_note_confidence" NOT NULL DEFAULT 'MEDIUM',
  "internal_notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "species_editor_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "species_images" (
  "id" UUID NOT NULL,
  "fish_species_id" UUID NOT NULL,
  "url" VARCHAR(1024) NOT NULL,
  "alt_text_en" VARCHAR(512),
  "alt_text_tr" VARCHAR(512),
  "role" "species_image_role" NOT NULL DEFAULT 'GALLERY',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "deleted_at" TIMESTAMPTZ(6),

  CONSTRAINT "species_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "species_techniques" (
  "id" UUID NOT NULL,
  "fish_species_id" UUID NOT NULL,
  "technique_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "deleted_at" TIMESTAMPTZ(6),

  CONSTRAINT "species_techniques_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "species_profiles_fish_species_id_key" ON "species_profiles"("fish_species_id");
CREATE INDEX "species_profiles_lifecycle_state_idx" ON "species_profiles"("lifecycle_state");

CREATE UNIQUE INDEX "species_classifications_fish_species_id_key" ON "species_classifications"("fish_species_id");

CREATE UNIQUE INDEX "species_editor_notes_fish_species_id_key" ON "species_editor_notes"("fish_species_id");

CREATE INDEX "species_images_fish_species_id_idx" ON "species_images"("fish_species_id");
CREATE INDEX "species_images_role_idx" ON "species_images"("role");
CREATE INDEX "species_images_deleted_at_idx" ON "species_images"("deleted_at");

CREATE UNIQUE INDEX "species_techniques_fish_species_id_technique_id_key" ON "species_techniques"("fish_species_id", "technique_id");
CREATE INDEX "species_techniques_fish_species_id_idx" ON "species_techniques"("fish_species_id");
CREATE INDEX "species_techniques_technique_id_idx" ON "species_techniques"("technique_id");
CREATE INDEX "species_techniques_deleted_at_idx" ON "species_techniques"("deleted_at");

ALTER TABLE "species_profiles"
  ADD CONSTRAINT "species_profiles_fish_species_id_fkey"
  FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "species_classifications"
  ADD CONSTRAINT "species_classifications_fish_species_id_fkey"
  FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "species_editor_notes"
  ADD CONSTRAINT "species_editor_notes_fish_species_id_fkey"
  FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "species_images"
  ADD CONSTRAINT "species_images_fish_species_id_fkey"
  FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "species_techniques"
  ADD CONSTRAINT "species_techniques_fish_species_id_fkey"
  FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "species_techniques"
  ADD CONSTRAINT "species_techniques_technique_id_fkey"
  FOREIGN KEY ("technique_id") REFERENCES "techniques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
