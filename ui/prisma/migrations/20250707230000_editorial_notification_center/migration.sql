-- Sprint 7.6F — Editorial Notification Center enhancements

ALTER TYPE "platform_notification_status" ADD VALUE IF NOT EXISTS 'RESOLVED';

ALTER TYPE "catalog_audit_action" ADD VALUE IF NOT EXISTS 'NOTIFICATION_REVIEW';
ALTER TYPE "catalog_audit_action" ADD VALUE IF NOT EXISTS 'NOTIFICATION_REVIEW_CATEGORY';
ALTER TYPE "catalog_audit_action" ADD VALUE IF NOT EXISTS 'NOTIFICATION_REVIEW_ALL';

ALTER TABLE "platform_notifications"
  ADD COLUMN IF NOT EXISTS "category" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "resolved_automatically" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "assigned_editor_id" UUID,
  ADD COLUMN IF NOT EXISTS "assigned_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "assigned_by" VARCHAR(128);

UPDATE "platform_notifications"
SET
  "status" = 'RESOLVED',
  "resolved_at" = COALESCE("closed_at", "updated_at"),
  "resolved_automatically" = true
WHERE "status" = 'CLOSED';

CREATE INDEX IF NOT EXISTS "platform_notifications_assigned_editor_id_status_idx"
  ON "platform_notifications"("assigned_editor_id", "status");
