import type { ScoreBoard } from "@/modules/studio/ai-review/lib/quality-report";

/** Editorial readiness lifecycle — deterministic, no LLM. */
export type EditorReadinessStatus =
  | "DRAFT"
  | "INCOMPLETE"
  | "REVIEW_NEEDED"
  | "READY"
  | "PRODUCTION_READY";

export const READINESS_STATUS_LABELS: Record<EditorReadinessStatus, string> = {
  DRAFT: "Draft",
  INCOMPLETE: "Incomplete",
  REVIEW_NEEDED: "Review Needed",
  READY: "Ready",
  PRODUCTION_READY: "Production Ready",
};

export function computeReadinessStatus(input: {
  scoreBoard: ScoreBoard;
  pendingSuggestions: number;
  lifecycleState?: string | null;
  isDraft?: boolean;
}): EditorReadinessStatus {
  if (input.isDraft) return "DRAFT";

  const { overall, criticalIssues, readyForPublication } = input.scoreBoard;
  const published = input.lifecycleState === "PUBLISHED";

  if (published && readyForPublication) return "PRODUCTION_READY";
  if (readyForPublication && input.pendingSuggestions === 0) return "READY";
  if (criticalIssues > 0 || input.pendingSuggestions > 0) return "REVIEW_NEEDED";
  if (overall < 60) return "INCOMPLETE";
  if (overall < 85) return "REVIEW_NEEDED";
  return "READY";
}

export function readinessBadgeVariant(
  status: EditorReadinessStatus,
): "ocean" | "coral" | "muted" {
  switch (status) {
    case "PRODUCTION_READY":
    case "READY":
      return "ocean";
    case "REVIEW_NEEDED":
    case "INCOMPLETE":
      return "coral";
    default:
      return "muted";
  }
}
