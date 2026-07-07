import type { StudioReviewEntityType } from "@/generated/prisma/client";
import {
  META_FIELD_KEYS,
  type QualityCheckItem,
  type ScoreBoard,
} from "@/modules/studio/ai-review/lib/quality-report";
import {
  computeReadinessStatus,
  type EditorReadinessStatus,
} from "@/modules/studio/ai-review/lib/readiness-status";

export type EntityHealthProfile = {
  entityType: StudioReviewEntityType;
  entityId: string;
  scannedAt: string;
  readinessStatus: EditorReadinessStatus;
  scoreBoard: ScoreBoard;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  missingRelationships: string[];
  localizationStatus: { en: boolean; tr: boolean };
  mediaStatus: "complete" | "partial" | "missing";
  seoStatus: "complete" | "partial" | "missing";
  knowledgeStatus: "linked" | "partial" | "missing";
};

function statusLevel(
  checks: QualityCheckItem[],
  category: QualityCheckItem["category"],
): "complete" | "partial" | "missing" {
  const subset = checks.filter((c) => c.category === category);
  if (subset.length === 0) return "missing";
  const fails = subset.filter((c) => c.status === "fail").length;
  const warns = subset.filter((c) => c.status === "warn").length;
  if (fails > 0) return "missing";
  if (warns > 0) return "partial";
  return "complete";
}

function knowledgeLevel(checks: QualityCheckItem[]): EntityHealthProfile["knowledgeStatus"] {
  const graphKnowledge = checks.filter((c) => c.id.startsWith("graph.knowledge"));
  const knowledgeChecks = checks.filter((c) => c.category === "knowledge");
  const all = [...graphKnowledge, ...knowledgeChecks];
  if (all.length === 0) return "missing";
  if (all.every((c) => c.status === "pass")) return "linked";
  if (all.some((c) => c.status === "pass")) return "partial";
  return "missing";
}

export function buildEntityHealthProfile(input: {
  entityType: StudioReviewEntityType;
  entityId: string;
  checks: QualityCheckItem[];
  scoreBoard: ScoreBoard;
  pendingSuggestions: number;
  lifecycleState?: string | null;
}): EntityHealthProfile {
  const criticalIssues = input.checks
    .filter((c) => c.status === "fail")
    .map((c) => (c.detail ? `${c.label}: ${c.detail}` : c.label));

  const warnings = input.checks
    .filter((c) => c.status === "warn")
    .map((c) => (c.detail ? `${c.label}: ${c.detail}` : c.label));

  const missingRelationships = input.checks
    .filter(
      (c) =>
        c.category === "relationships" &&
        c.status !== "pass" &&
        (c.id.startsWith("graph.") || c.label.toLowerCase().includes("link")),
    )
    .map((c) => c.detail ?? c.label);

  const recommendations = warnings.slice(0, 8);

  const enChecks = input.checks.filter(
    (c) => c.id.includes("En") || c.id === "nameEn" || c.id === "descEn" || c.id === "slugEn",
  );
  const trChecks = input.checks.filter(
    (c) => c.id.includes("Tr") || c.id === "nameTr" || c.id === "descTr" || c.id === "slugTr",
  );

  const enOk = enChecks.length === 0 || enChecks.every((c) => c.status === "pass");
  const trOk = trChecks.length === 0 || trChecks.every((c) => c.status === "pass");

  return {
    entityType: input.entityType,
    entityId: input.entityId,
    scannedAt: new Date().toISOString(),
    readinessStatus: computeReadinessStatus({
      scoreBoard: input.scoreBoard,
      pendingSuggestions: input.pendingSuggestions,
      lifecycleState: input.lifecycleState,
    }),
    scoreBoard: input.scoreBoard,
    criticalIssues,
    warnings,
    recommendations,
    missingRelationships,
    localizationStatus: { en: enOk, tr: trOk },
    mediaStatus: statusLevel(input.checks, "media"),
    seoStatus: statusLevel(input.checks, "seo"),
    knowledgeStatus: knowledgeLevel(input.checks),
  };
}

export function parseEntityHealthFromSession(
  suggestions: Array<{ fieldKey: string; suggestedValue: string }>,
): EntityHealthProfile | null {
  const row = suggestions.find((s) => s.fieldKey === META_FIELD_KEYS.entityHealth);
  if (!row) return null;
  try {
    return JSON.parse(row.suggestedValue) as EntityHealthProfile;
  } catch {
    return null;
  }
}
