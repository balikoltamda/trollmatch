import type {
  PlatformNotificationSeverity,
  PlatformNotificationSource,
  PlatformNotificationStatus,
  StudioReviewEntityType,
} from "@/generated/prisma/client";

export type NotificationFilter = "all" | "unread" | "reviewed" | "resolved";

export type NotificationView = {
  id: string;
  source: PlatformNotificationSource;
  severity: PlatformNotificationSeverity;
  status: PlatformNotificationStatus;
  entityType: StudioReviewEntityType | null;
  entityId: string | null;
  entityName: string | null;
  entityHref: string | null;
  category: string | null;
  title: string;
  description: string;
  fingerprint: string;
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

export type NotificationCenterData = {
  unresolvedCount: number;
  notifications: NotificationView[];
  counts: {
    critical: number;
    warning: number;
    suggestion: number;
  };
};

export type NotificationDraft = {
  source: PlatformNotificationSource;
  severity: PlatformNotificationSeverity;
  entityType: StudioReviewEntityType;
  entityId: string;
  entityLabel: string;
  entityHref: string | null;
  category: string | null;
  title: string;
  description: string;
  issueFingerprint: string;
  sessionId?: string;
};

export type EntityEditorialInsights = {
  openNotifications: NotificationView[];
  resolvedNotifications: NotificationView[];
  openCount: number;
  resolvedCount: number;
  latestReviewDate: Date | null;
  readinessScore: number | null;
};

export type WorkQueueData = {
  myPendingWork: NotificationView[];
  criticalIssues: NotificationView[];
  needsReview: NotificationView[];
  recentlyResolved: NotificationView[];
  recentlyCreated: NotificationView[];
  totals: {
    unresolved: number;
    critical: number;
    reviewed: number;
    resolved: number;
  };
};

export const SEVERITY_LABELS: Record<PlatformNotificationSeverity, string> = {
  CRITICAL: "Critical",
  WARNING: "Warnings",
  SUGGESTION: "Suggestions",
};

export const SEVERITY_ORDER: PlatformNotificationSeverity[] = [
  "CRITICAL",
  "WARNING",
  "SUGGESTION",
];

export const FILTER_LABELS: Record<NotificationFilter, string> = {
  all: "All",
  unread: "Unread",
  reviewed: "Reviewed",
  resolved: "Resolved",
};

/** Unread editorial items shown in bell badge. */
export function isUnresolvedStatus(status: PlatformNotificationStatus): boolean {
  return status === "ACTIVE";
}
