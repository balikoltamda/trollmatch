-- Sprint 3: manufacturer fishing attributes on lure_models (nullable for backward compatibility)

ALTER TABLE "lure_models"
  ADD COLUMN "body_type_slug" VARCHAR(64),
  ADD COLUMN "body_type_en" VARCHAR(128),
  ADD COLUMN "body_type_tr" VARCHAR(128),
  ADD COLUMN "buoyancy_slug" VARCHAR(64),
  ADD COLUMN "buoyancy_en" VARCHAR(128),
  ADD COLUMN "buoyancy_tr" VARCHAR(128),
  ADD COLUMN "diving_depth_min_m" DECIMAL(6,2),
  ADD COLUMN "diving_depth_max_m" DECIMAL(6,2),
  ADD COLUMN "trolling_speed_min_kn" DECIMAL(5,2),
  ADD COLUMN "trolling_speed_max_kn" DECIMAL(5,2),
  ADD COLUMN "coating_type_slug" VARCHAR(64),
  ADD COLUMN "coating_type_en" VARCHAR(128),
  ADD COLUMN "coating_type_tr" VARCHAR(128),
  ADD COLUMN "action_slug" VARCHAR(64),
  ADD COLUMN "action_en" VARCHAR(128),
  ADD COLUMN "action_tr" VARCHAR(128);
