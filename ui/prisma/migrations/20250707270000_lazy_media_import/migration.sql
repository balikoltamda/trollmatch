-- Lazy media import — store remote metadata on image rows without requiring download.

ALTER TABLE "images" ADD COLUMN "mime_type" VARCHAR(128);
ALTER TABLE "images" ADD COLUMN "width_px" INTEGER;
ALTER TABLE "images" ADD COLUMN "height_px" INTEGER;
