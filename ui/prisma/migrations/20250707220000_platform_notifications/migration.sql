-- Platform Notification Center (Sprint 7.6E)

CREATE TYPE "platform_notification_source" AS ENUM ('EDITORIAL_INTELLIGENCE');

CREATE TYPE "platform_notification_severity" AS ENUM ('CRITICAL', 'WARNING', 'SUGGESTION');

CREATE TYPE "platform_notification_status" AS ENUM ('ACTIVE', 'REVIEWED', 'CLOSED');

CREATE TABLE "platform_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source" "platform_notification_source" NOT NULL,
    "severity" "platform_notification_severity" NOT NULL,
    "status" "platform_notification_status" NOT NULL DEFAULT 'ACTIVE',
    "entity_type" "studio_review_entity_type",
    "entity_id" UUID,
    "entity_label" VARCHAR(256),
    "entity_href" VARCHAR(512),
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT NOT NULL,
    "issue_fingerprint" VARCHAR(320) NOT NULL,
    "session_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" VARCHAR(128),
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_notifications_status_severity_created_at_idx"
  ON "platform_notifications"("status", "severity", "created_at" DESC);

CREATE INDEX "platform_notifications_issue_fingerprint_status_idx"
  ON "platform_notifications"("issue_fingerprint", "status");

CREATE INDEX "platform_notifications_entity_type_entity_id_status_idx"
  ON "platform_notifications"("entity_type", "entity_id", "status");

CREATE UNIQUE INDEX "platform_notifications_active_fingerprint_key"
  ON "platform_notifications"("issue_fingerprint")
  WHERE "status" = 'ACTIVE';
