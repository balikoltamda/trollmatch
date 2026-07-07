import type {
  PlatformNotificationSeverity,
  PlatformNotificationStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  EntityEditorialInsights,
  NotificationCenterData,
  NotificationFilter,
  NotificationView,
  WorkQueueData,
} from "@/modules/notification-center/types";

type Row = {
  id: string;
  source: NotificationView["source"];
  severity: NotificationView["severity"];
  status: NotificationView["status"];
  entityType: NotificationView["entityType"];
  entityId: string | null;
  entityLabel: string | null;
  entityHref: string | null;
  category: string | null;
  title: string;
  description: string;
  issueFingerprint: string;
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  resolvedAt: Date | null;
  resolvedAutomatically: boolean;
  assignedEditorId: string | null;
  assignedAt: Date | null;
  assignedBy: string | null;
};

function toView(row: Row): NotificationView {
  return {
    id: row.id,
    source: row.source,
    severity: row.severity,
    status: row.status,
    entityType: row.entityType,
    entityId: row.entityId,
    entityName: row.entityLabel,
    entityHref: row.entityHref,
    category: row.category,
    title: row.title,
    description: row.description,
    fingerprint: row.issueFingerprint,
    sessionId: row.sessionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reviewedAt: row.reviewedAt,
    reviewedBy: row.reviewedBy,
    resolvedAt: row.resolvedAt,
    resolvedAutomatically: row.resolvedAutomatically,
    assignedEditorId: row.assignedEditorId,
    assignedAt: row.assignedAt,
    assignedBy: row.assignedBy,
  };
}

function filterWhere(filter: NotificationFilter): { status?: { in: PlatformNotificationStatus[] } } {
  switch (filter) {
    case "unread":
      return { status: { in: ["ACTIVE"] } };
    case "reviewed":
      return { status: { in: ["REVIEWED"] } };
    case "resolved":
      return { status: { in: ["RESOLVED", "CLOSED"] } };
    default:
      return {};
  }
}

function sortNewestFirst(items: NotificationView[]): NotificationView[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function countUnresolvedNotifications(): Promise<number> {
  return prisma.platformNotification.count({ where: { status: "ACTIVE" } });
}

export async function loadNotifications(
  filter: NotificationFilter = "unread",
  limit = 100,
): Promise<NotificationCenterData> {
  const where = filterWhere(filter);
  const notifications = await prisma.platformNotification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const views = sortNewestFirst(notifications.map(toView));
  const unread = filter === "unread" ? views : views.filter((n) => n.status === "ACTIVE");

  return {
    unresolvedCount:
      filter === "unread"
        ? views.length
        : await countUnresolvedNotifications(),
    notifications: views,
    counts: {
      critical: unread.filter((n) => n.severity === "CRITICAL").length,
      warning: unread.filter((n) => n.severity === "WARNING").length,
      suggestion: unread.filter((n) => n.severity === "SUGGESTION").length,
    },
  };
}

export async function loadEntityEditorialInsights(
  entityType: NotificationView["entityType"],
  entityId: string,
  readinessScore: number | null,
  latestReviewDate: Date | null,
): Promise<EntityEditorialInsights> {
  const rows = await prisma.platformNotification.findMany({
    where: { entityType: entityType ?? undefined, entityId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const views = rows.map(toView);
  return {
    openNotifications: views.filter((n) => n.status === "ACTIVE"),
    resolvedNotifications: views.filter(
      (n) => n.status === "RESOLVED" || n.status === "CLOSED",
    ),
    openCount: views.filter((n) => n.status === "ACTIVE").length,
    resolvedCount: views.filter((n) => n.status === "RESOLVED" || n.status === "CLOSED").length,
    latestReviewDate,
    readinessScore,
  };
}

export async function loadWorkQueue(editorId?: string): Promise<WorkQueueData> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [active, reviewed, resolved, recentResolved, recentCreated] = await Promise.all([
    prisma.platformNotification.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.platformNotification.count({ where: { status: "REVIEWED" } }),
    prisma.platformNotification.count({
      where: { status: { in: ["RESOLVED", "CLOSED"] } },
    }),
    prisma.platformNotification.findMany({
      where: {
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { gte: sevenDaysAgo },
      },
      orderBy: { resolvedAt: "desc" },
      take: 12,
    }),
    prisma.platformNotification.findMany({
      where: { status: "ACTIVE", createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const activeViews = active.map(toView);
  const myPending = editorId
    ? activeViews.filter((n) => n.assignedEditorId === editorId || !n.assignedEditorId)
    : activeViews;

  return {
    myPendingWork: myPending.slice(0, 12),
    criticalIssues: activeViews.filter((n) => n.severity === "CRITICAL").slice(0, 12),
    needsReview: activeViews.slice(0, 12),
    recentlyResolved: recentResolved.map(toView),
    recentlyCreated: recentCreated.map(toView),
    totals: {
      unresolved: activeViews.length,
      critical: activeViews.filter((n) => n.severity === "CRITICAL").length,
      reviewed,
      resolved,
    },
  };
}

export async function markNotificationReviewed(
  id: string,
  reviewer: string,
): Promise<NotificationView | null> {
  const row = await prisma.platformNotification.findUnique({ where: { id } });
  if (!row || row.status !== "ACTIVE") return null;

  const updated = await prisma.platformNotification.update({
    where: { id },
    data: {
      status: "REVIEWED",
      reviewedAt: new Date(),
      reviewedBy: reviewer,
    },
  });
  return toView(updated);
}

export async function markCategoryReviewed(
  severity: PlatformNotificationSeverity,
  reviewer: string,
): Promise<number> {
  const result = await prisma.platformNotification.updateMany({
    where: { status: "ACTIVE", severity },
    data: {
      status: "REVIEWED",
      reviewedAt: new Date(),
      reviewedBy: reviewer,
    },
  });
  return result.count;
}

export async function markAllNotificationsReviewed(reviewer: string): Promise<number> {
  const result = await prisma.platformNotification.updateMany({
    where: { status: "ACTIVE" },
    data: {
      status: "REVIEWED",
      reviewedAt: new Date(),
      reviewedBy: reviewer,
    },
  });
  return result.count;
}

// Backward-compatible aliases
export const countActiveNotifications = countUnresolvedNotifications;
export const loadActiveNotifications = () => loadNotifications("unread");
