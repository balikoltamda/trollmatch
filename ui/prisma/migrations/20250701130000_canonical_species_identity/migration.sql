-- Sprint Foundation F002 — canonical species identity

-- CreateEnum
CREATE TYPE "species_alias_kind" AS ENUM ('SEARCH_TERM', 'REGIONAL_NAME', 'MISSPELLING', 'SYNONYM');

-- CreateTable
CREATE TABLE "species_scientific_names" (
    "id" UUID NOT NULL,
    "fish_species_id" UUID NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "name_normalized" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "species_scientific_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "species_common_names" (
    "id" UUID NOT NULL,
    "fish_species_id" UUID NOT NULL,
    "locale" VARCHAR(8) NOT NULL,
    "country_code" CHAR(2),
    "country_scope" VARCHAR(8) NOT NULL DEFAULT 'global',
    "name" VARCHAR(256) NOT NULL,
    "name_normalized" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "species_common_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "species_aliases" (
    "id" UUID NOT NULL,
    "fish_species_id" UUID NOT NULL,
    "locale" VARCHAR(8) NOT NULL DEFAULT 'any',
    "country_code" CHAR(2),
    "country_scope" VARCHAR(8) NOT NULL DEFAULT 'global',
    "alias" VARCHAR(512) NOT NULL,
    "alias_normalized" VARCHAR(512) NOT NULL,
    "kind" "species_alias_kind" NOT NULL DEFAULT 'SEARCH_TERM',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "species_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "species_scientific_names_fish_species_id_key" ON "species_scientific_names"("fish_species_id");

-- CreateIndex
CREATE UNIQUE INDEX "species_scientific_names_name_normalized_key" ON "species_scientific_names"("name_normalized");

-- CreateIndex
CREATE INDEX "species_scientific_names_deleted_at_idx" ON "species_scientific_names"("deleted_at");

-- CreateIndex
CREATE INDEX "species_common_names_fish_species_id_idx" ON "species_common_names"("fish_species_id");

-- CreateIndex
CREATE INDEX "species_common_names_locale_idx" ON "species_common_names"("locale");

-- CreateIndex
CREATE INDEX "species_common_names_country_code_idx" ON "species_common_names"("country_code");

-- CreateIndex
CREATE INDEX "species_common_names_deleted_at_idx" ON "species_common_names"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "species_common_names_fish_species_id_locale_country_scope_name_key" ON "species_common_names"("fish_species_id", "locale", "country_scope", "name_normalized");

-- CreateIndex
CREATE INDEX "species_aliases_fish_species_id_idx" ON "species_aliases"("fish_species_id");

-- CreateIndex
CREATE INDEX "species_aliases_locale_idx" ON "species_aliases"("locale");

-- CreateIndex
CREATE INDEX "species_aliases_country_code_idx" ON "species_aliases"("country_code");

-- CreateIndex
CREATE INDEX "species_aliases_kind_idx" ON "species_aliases"("kind");

-- CreateIndex
CREATE INDEX "species_aliases_deleted_at_idx" ON "species_aliases"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "species_aliases_alias_normalized_locale_country_scope_key" ON "species_aliases"("alias_normalized", "locale", "country_scope");

-- AddForeignKey
ALTER TABLE "species_scientific_names" ADD CONSTRAINT "species_scientific_names_fish_species_id_fkey" FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species_common_names" ADD CONSTRAINT "species_common_names_fish_species_id_fkey" FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species_aliases" ADD CONSTRAINT "species_aliases_fish_species_id_fkey" FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;
