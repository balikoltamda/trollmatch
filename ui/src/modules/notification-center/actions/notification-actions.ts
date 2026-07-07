"use server";

import { revalidatePath } from "next/cache";
import type { PlatformNotificationSeverity } from "@/generated/prisma/client";
import { getLatestAiReviewSession } from "@/modules/studio/ai-review/data/ai-review-repository";
import { parseReadinessScoreFromSession } from "@/modules/studio/ai-review/lib/quality-report";
import type { StudioReviewEntityType } from "@/generated/prisma/client";
import {
  auditActor,
  isUnauthorizedResult,
  requireEditorOrUnauthorized,
} from "@/modules/studio/auth/permissions";
import { recordCatalogAudit } from "@/modules/studio/data/audit";
import {
  countUnresolvedNotifications,
  loadEntityEditorialInsights,
  loadNotifications,
  loadWorkQueue,
  markAllNotificationsReviewed,
  markCategoryReviewed,
  markNotificationReviewed,
} from "@/modules/notification-center/data/notification-repository";
import type {
  EntityEditorialInsights,
  NotificationCenterData,
  NotificationFilter,
  WorkQueueData,
} from "@/modules/notification-center/types";
import { STUDIO_WORK_QUEUE_PATH } from "@/modules/studio/lib/studio-routes";

function revalidateStudio() {
  revalidatePath("/studio", "layout");
  revalidatePath(STUDIO_WORK_QUEUE_PATH);
}

export async function getNotificationCenterData(
  filter: NotificationFilter = "unread",
): Promise<NotificationCenterData | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;
  return loadNotifications(filter);
}

export async function getUnresolvedNotificationCount(): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;
  const count = await countUnresolvedNotifications();
  return { ok: true, count };
}

/** @deprecated use getUnresolvedNotificationCount */
export const getActiveNotificationCount = getUnresolvedNotificationCount;

export async function getWorkQueueData(): Promise<
  WorkQueueData | { ok: false; error: string }
> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;
  return loadWorkQueue(auth.id);
}

export async function getEntityEditorialInsights(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<EntityEditorialInsights | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const session = await getLatestAiReviewSession({ entityType, entityId });
  const readinessScore = session
    ? parseReadinessScoreFromSession(session.suggestions)
    : null;

  return loadEntityEditorialInsights(
    entityType,
    entityId,
    readinessScore,
    session?.createdAt ?? null,
  );
}

export async function markNotificationAsReviewed(
  notificationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const updated = await markNotificationReviewed(notificationId, auditActor(auth));
  if (!updated) return { ok: false, error: "Notification not found or already reviewed" };

  await recordCatalogAudit({
    entityType: "platform_notification",
    entityId: notificationId,
    action: "NOTIFICATION_REVIEW",
    actor: auditActor(auth),
    summary: `Marked notification reviewed: ${updated.title}`,
    metadata: {
      fingerprint: updated.fingerprint,
      severity: updated.severity,
      entityType: updated.entityType,
      entityId: updated.entityId,
    },
  });

  revalidateStudio();
  return { ok: true };
}

export async function markNotificationCategoryAsReviewed(
  severity: PlatformNotificationSeverity,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const count = await markCategoryReviewed(severity, auditActor(auth));

  await recordCatalogAudit({
    entityType: "platform_notification",
    entityId: "batch",
    action: "NOTIFICATION_REVIEW_CATEGORY",
    actor: auditActor(auth),
    summary: `Marked ${count} ${severity} notifications reviewed`,
    metadata: { severity, count },
  });

  revalidateStudio();
  return { ok: true, count };
}

export async function markAllNotificationsAsReviewed(): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const count = await markAllNotificationsReviewed(auditActor(auth));

  await recordCatalogAudit({
    entityType: "platform_notification",
    entityId: "batch",
    action: "NOTIFICATION_REVIEW_ALL",
    actor: auditActor(auth),
    summary: `Marked all ${count} active notifications reviewed`,
    metadata: { count },
  });

  revalidateStudio();
  return { ok: true, count };
}
