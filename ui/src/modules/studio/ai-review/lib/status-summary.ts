import type { AiReviewStatusSummary, AiSuggestionView } from "@/modules/studio/ai-review/types";

export function summarizeReviewStatus(
  suggestions: AiSuggestionView[],
): AiReviewStatusSummary {
  return {
    pending: suggestions.filter((s) => s.status === "PENDING").length,
    approved: suggestions.filter((s) => s.status === "APPROVED" || s.status === "MERGED").length,
    rejected: suggestions.filter((s) => s.status === "REJECTED").length,
    total: suggestions.length,
  };
}
