export type {
  EntityEditorialInsights,
  NotificationCenterData,
  NotificationDraft,
  NotificationFilter,
  NotificationView,
  WorkQueueData,
} from "@/modules/notification-center/types";

export {
  FILTER_LABELS,
  SEVERITY_LABELS,
  SEVERITY_ORDER,
  isUnresolvedStatus,
} from "@/modules/notification-center/types";

export {
  getNotificationCenterData,
  getUnresolvedNotificationCount,
  getActiveNotificationCount,
  getWorkQueueData,
  getEntityEditorialInsights,
  markNotificationAsReviewed,
  markNotificationCategoryAsReviewed,
  markAllNotificationsAsReviewed,
} from "@/modules/notification-center/actions/notification-actions";

export { NotificationCenter } from "@/modules/notification-center/components/notification-center";

export { syncEditorialNotifications } from "@/modules/notification-center/lib/sync-editorial-notifications";

export {
  buildIssueFingerprint,
  buildCheckFingerprint,
  buildSuggestionFingerprint,
  buildDuplicateFingerprint,
} from "@/modules/notification-center/lib/issue-fingerprint";

export {
  resolveEntityHref,
  resolveEntityName,
  resolveEntitySlug,
} from "@/modules/notification-center/lib/entity-links";
