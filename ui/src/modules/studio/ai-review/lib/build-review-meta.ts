import type { AiSuggestionDraft } from "@/modules/studio/ai-review/types";
import {
  META_FIELD_KEYS,
  type QualityCheckItem,
} from "@/modules/studio/ai-review/lib/quality-report";
import { computeScoreBoard } from "@/modules/studio/ai-review/lib/score-board";
import {
  buildEntityHealthProfile,
  type EntityHealthProfile,
} from "@/modules/studio/ai-review/lib/entity-health";

export function buildMetaSuggestions(
  checks: QualityCheckItem[],
  healthContext?: {
    entityType: EntityHealthProfile["entityType"];
    entityId: string;
    pendingSuggestions?: number;
    lifecycleState?: string | null;
  },
): AiSuggestionDraft[] {
  if (checks.length === 0) return [];

  const scoreBoard = computeScoreBoard(checks);
  const meta: AiSuggestionDraft[] = [
    {
      fieldKey: META_FIELD_KEYS.qualityReport,
      fieldLabel: "Quality report",
      suggestedValue: JSON.stringify(checks),
      confidencePct: scoreBoard.overall,
      source: "AI_ENRICHMENT",
      reasoning: `Editorial readiness ${scoreBoard.overall}% from ${checks.length} validation checks.`,
      provenance: { checkCount: checks.length, affectedFields: ["quality"], impact: "medium" },
    },
    {
      fieldKey: META_FIELD_KEYS.readinessScore,
      fieldLabel: "Readiness score",
      suggestedValue: String(scoreBoard.overall),
      confidencePct: scoreBoard.overall,
      source: "AI_ENRICHMENT",
      reasoning: "Overall weighted score across editorial, scientific, media, relationships, localization, SEO, and knowledge.",
      provenance: { score: scoreBoard.overall, affectedFields: ["readiness"], impact: "high" },
    },
    {
      fieldKey: META_FIELD_KEYS.scoreBoard,
      fieldLabel: "Score board",
      suggestedValue: JSON.stringify(scoreBoard),
      confidencePct: scoreBoard.overall,
      source: "AI_ENRICHMENT",
      reasoning: scoreBoard.readyForPublication
        ? "Entity meets publication readiness threshold."
        : "Entity needs editorial attention before publication.",
      provenance: {
        affectedFields: ["readiness", "lifecycle"],
        impact: scoreBoard.readyForPublication ? "low" : "high",
      },
    },
  ];

  if (healthContext?.entityId) {
    const health = buildEntityHealthProfile({
      entityType: healthContext.entityType,
      entityId: healthContext.entityId,
      checks,
      scoreBoard,
      pendingSuggestions: healthContext.pendingSuggestions ?? 0,
      lifecycleState: healthContext.lifecycleState,
    });
    meta.push({
      fieldKey: META_FIELD_KEYS.entityHealth,
      fieldLabel: "Entity health profile",
      suggestedValue: JSON.stringify(health),
      confidencePct: scoreBoard.overall,
      source: "AI_ENRICHMENT",
      reasoning: `Readiness: ${health.readinessStatus.replace(/_/g, " ")} · ${health.criticalIssues.length} critical · ${health.warnings.length} warnings.`,
      provenance: {
        affectedFields: ["health", "readiness"],
        impact: health.criticalIssues.length > 0 ? "high" : "medium",
      },
    });
  }

  return meta;
}
