import type { ContentLifecycleState } from "@/generated/prisma/client";

export type EditorialStatusLabel =
  | "Draft"
  | "Needs Review"
  | "Ready"
  | "Published"
  | "Archived"
  | "Deprecated"
  | "Rejected";

const STATUS_LABELS: Record<ContentLifecycleState, EditorialStatusLabel> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Needs Review",
  READY: "Ready",
  PUBLISHED: "Published",
  DEPRECATED: "Deprecated",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export function editorialStatusLabel(
  state: ContentLifecycleState,
): EditorialStatusLabel {
  return STATUS_LABELS[state];
}

export const EDITORIAL_STATUS_OPTIONS: ContentLifecycleState[] = [
  "DRAFT",
  "PENDING_REVIEW",
  "READY",
  "PUBLISHED",
  "ARCHIVED",
  "DEPRECATED",
  "REJECTED",
];

export function editorialStatusTone(
  state: ContentLifecycleState,
): "muted" | "ocean" | "warning" | "success" {
  switch (state) {
    case "PUBLISHED":
      return "success";
    case "PENDING_REVIEW":
      return "warning";
    case "READY":
      return "ocean";
    default:
      return "muted";
  }
}
