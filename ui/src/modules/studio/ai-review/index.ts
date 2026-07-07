export type {
  AiReviewEntityType,
  AiReviewSessionView,
  AiReviewStatusSummary,
  AiSuggestionView,
  DuplicateMatch,
} from "@/modules/studio/ai-review/types";

export type { ReviewTrigger, EditorialReviewResult } from "@/modules/studio/ai-review/lib/run-editorial-review";

export {
  runAiReviewAnalysis,
  acceptAiSuggestion,
  rejectAiSuggestion,
  acceptAllAiSuggestions,
  rejectAllAiSuggestions,
  loadAiReviewSession,
  checkEntityDuplicates,
  ensureEntityAiReview,
} from "@/modules/studio/ai-review/actions/ai-review-actions";

export { AiReviewPanel } from "@/modules/studio/ai-review/components/ai-review-panel";
export { AiReviewStatusBar } from "@/modules/studio/ai-review/components/ai-review-status-bar";
export { AiQualityReport } from "@/modules/studio/ai-review/components/ai-quality-report";
export { EntityInsightsPanel } from "@/modules/studio/ai-review/components/entity-insights-panel";
export { AiSeedAnalyzeForm } from "@/modules/studio/ai-review/components/ai-seed-analyze-form";
export { DuplicateWarningBanner } from "@/modules/studio/ai-review/components/duplicate-warning-banner";
export { EntityAiReviewMini } from "@/modules/studio/ai-review/components/entity-ai-review-mini";
export { TechniqueAiReviewSection } from "@/modules/studio/ai-review/components/technique-ai-review-section";

export { summarizeReviewStatus } from "@/modules/studio/ai-review/lib/status-summary";
export {
  computeReadinessScore,
  isMetaSuggestion,
  parseQualityReportFromSession,
  parseReadinessScoreFromSession,
  parseScoreBoardFromSession,
  SCORE_CATEGORY_LABELS,
} from "@/modules/studio/ai-review/lib/quality-report";

export {
  READINESS_STATUS_LABELS,
  readinessBadgeVariant,
  type EditorReadinessStatus,
} from "@/modules/studio/ai-review/lib/readiness-status";

export { applySpeciesAiSuggestion, extractDuplicatesFromSession } from "@/modules/studio/ai-review/lib/apply-species-suggestion";
