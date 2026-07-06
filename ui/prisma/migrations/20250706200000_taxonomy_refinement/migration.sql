-- Sprint 7.4.1 — Taxonomy & Naming Standard Refinement

ALTER TABLE "fish_species" ADD COLUMN IF NOT EXISTS "editorial_notes_en" TEXT;
ALTER TABLE "fish_species" ADD COLUMN IF NOT EXISTS "editorial_notes_tr" TEXT;

CREATE TABLE IF NOT EXISTS "species_confusions" (
    "id" UUID NOT NULL,
    "fish_species_id" UUID NOT NULL,
    "confused_with_species_id" UUID NOT NULL,
    "misapplied_name_en" VARCHAR(256),
    "misapplied_name_tr" VARCHAR(256),
    "reason_en" TEXT NOT NULL,
    "reason_tr" TEXT NOT NULL,
    "country_scope" VARCHAR(8) NOT NULL DEFAULT 'global',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "species_confusions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "species_confusions_fish_species_id_confused_with_species_id_country_scope_key"
    ON "species_confusions"("fish_species_id", "confused_with_species_id", "country_scope");

CREATE INDEX IF NOT EXISTS "species_confusions_fish_species_id_idx" ON "species_confusions"("fish_species_id");
CREATE INDEX IF NOT EXISTS "species_confusions_confused_with_species_id_idx" ON "species_confusions"("confused_with_species_id");

ALTER TABLE "species_confusions" ADD CONSTRAINT "species_confusions_fish_species_id_fkey"
    FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "species_confusions" ADD CONSTRAINT "species_confusions_confused_with_species_id_fkey"
    FOREIGN KEY ("confused_with_species_id") REFERENCES "fish_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;
