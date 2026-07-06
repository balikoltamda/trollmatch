-- Sprint 7.5 — Knowledge Hub & Source Intelligence

-- New source types
ALTER TYPE "knowledge_source_type" ADD VALUE IF NOT EXISTS 'FISHING_BLOG';
ALTER TYPE "knowledge_source_type" ADD VALUE IF NOT EXISTS 'MAGAZINE';

-- New item statuses
ALTER TYPE "knowledge_item_status" ADD VALUE IF NOT EXISTS 'ARCHIVED';
ALTER TYPE "knowledge_item_status" ADD VALUE IF NOT EXISTS 'OUTDATED';

-- New editor decisions
ALTER TYPE "knowledge_editor_decision" ADD VALUE IF NOT EXISTS 'ARCHIVED';
ALTER TYPE "knowledge_editor_decision" ADD VALUE IF NOT EXISTS 'OUTDATED';

-- New audit actions
ALTER TYPE "knowledge_audit_action" ADD VALUE IF NOT EXISTS 'ARCHIVE';
ALTER TYPE "knowledge_audit_action" ADD VALUE IF NOT EXISTS 'FLAG_OUTDATED';

-- Knowledge item fields
ALTER TABLE "knowledge_items" ADD COLUMN IF NOT EXISTS "source_preview_en" VARCHAR(512);
ALTER TABLE "knowledge_items" ADD COLUMN IF NOT EXISTS "source_preview_tr" VARCHAR(512);
ALTER TABLE "knowledge_items" ADD COLUMN IF NOT EXISTS "language" VARCHAR(8);
