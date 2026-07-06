-- Sprint 7.3 — Catch Report system

CREATE TYPE "catch_report_verification_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MERGED');
CREATE TYPE "boat_or_shore" AS ENUM ('BOAT', 'SHORE');

CREATE TABLE "catch_reports" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "fish_species_id" UUID NOT NULL,
    "lure_variant_id" UUID NOT NULL,
    "technique_id" UUID,
    "country" CHAR(2) NOT NULL,
    "region" VARCHAR(128) NOT NULL,
    "location" VARCHAR(256),
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "boat_or_shore" "boat_or_shore" NOT NULL,
    "water_depth_m" DECIMAL(6,2),
    "lure_depth_m" DECIMAL(6,2),
    "trolling_speed_kn" DECIMAL(5,2),
    "catch_count" INTEGER NOT NULL DEFAULT 1,
    "largest_length_cm" DECIMAL(6,2),
    "largest_weight_g" DECIMAL(8,2),
    "photo_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "verification_status" "catch_report_verification_status" NOT NULL DEFAULT 'PENDING',
    "merged_into_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catch_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "catch_reports_verification_status_created_at_idx" ON "catch_reports"("verification_status", "created_at" DESC);
CREATE INDEX "catch_reports_fish_species_id_verification_status_idx" ON "catch_reports"("fish_species_id", "verification_status");
CREATE INDEX "catch_reports_lure_variant_id_verification_status_idx" ON "catch_reports"("lure_variant_id", "verification_status");
CREATE INDEX "catch_reports_merged_into_id_idx" ON "catch_reports"("merged_into_id");

ALTER TABLE "catch_reports" ADD CONSTRAINT "catch_reports_fish_species_id_fkey" FOREIGN KEY ("fish_species_id") REFERENCES "fish_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catch_reports" ADD CONSTRAINT "catch_reports_lure_variant_id_fkey" FOREIGN KEY ("lure_variant_id") REFERENCES "lure_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catch_reports" ADD CONSTRAINT "catch_reports_technique_id_fkey" FOREIGN KEY ("technique_id") REFERENCES "techniques"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catch_reports" ADD CONSTRAINT "catch_reports_merged_into_id_fkey" FOREIGN KEY ("merged_into_id") REFERENCES "catch_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
