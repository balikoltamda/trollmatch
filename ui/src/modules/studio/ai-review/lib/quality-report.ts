export type QualityCheckStatus = "pass" | "warn" | "fail";

export type ScoreCategory =
  | "editorial"
  | "scientific"
  | "media"
  | "relationships"
  | "localization"
  | "seo"
  | "knowledge";

export type QualityCheckItem = {
  id: string;
  label: string;
  status: QualityCheckStatus;
  category: ScoreCategory;
  detail?: string;
  weight: number;
};

export type ScoreBoard = {
  editorial: number;
  scientific: number;
  media: number;
  relationships: number;
  localization: number;
  seo: number;
  knowledge: number;
  overall: number;
  readyForPublication: boolean;
  criticalIssues: number;
  warnings: number;
};

export const META_FIELD_KEYS = {
  qualityReport: "meta.qualityReport",
  readinessScore: "meta.readinessScore",
  scoreBoard: "meta.scoreBoard",
  entityHealth: "meta.entityHealth",
  graphAnalysis: "meta.graphAnalysis",
  duplicateWarning: "duplicateWarning",
} as const;

export function computeReadinessScore(checks: QualityCheckItem[]): number {
  if (checks.length === 0) return 0;
  const total = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => {
    if (check.status === "pass") return sum + check.weight;
    if (check.status === "warn") return sum + check.weight * 0.5;
    return sum;
  }, 0);
  return Math.round((earned / total) * 100);
}

export function isMetaSuggestion(fieldKey: string): boolean {
  return fieldKey.startsWith("meta.") || fieldKey === META_FIELD_KEYS.duplicateWarning;
}

export function isBulkActionable(fieldKey: string): boolean {
  return !isMetaSuggestion(fieldKey);
}

export function parseQualityReportFromSession(
  suggestions: Array<{ fieldKey: string; suggestedValue: string }>,
): QualityCheckItem[] {
  const row = suggestions.find((s) => s.fieldKey === META_FIELD_KEYS.qualityReport);
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.suggestedValue) as QualityCheckItem[];
    return parsed.map((c) => ({ ...c, category: c.category ?? "editorial" }));
  } catch {
    return [];
  }
}

export function parseScoreBoardFromSession(
  suggestions: Array<{ fieldKey: string; suggestedValue: string }>,
): ScoreBoard | null {
  const row = suggestions.find((s) => s.fieldKey === META_FIELD_KEYS.scoreBoard);
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.suggestedValue) as ScoreBoard;
    return { ...parsed, knowledge: parsed.knowledge ?? 100 };
  } catch {
    return null;
  }
}

export function parseReadinessScoreFromSession(
  suggestions: Array<{ fieldKey: string; suggestedValue: string }>,
): number | null {
  const board = parseScoreBoardFromSession(suggestions);
  if (board) return board.overall;
  const row = suggestions.find((s) => s.fieldKey === META_FIELD_KEYS.readinessScore);
  if (!row) return null;
  const score = Number.parseInt(row.suggestedValue, 10);
  return Number.isFinite(score) ? score : null;
}

export function statusIcon(status: QualityCheckStatus): string {
  switch (status) {
    case "pass":
      return "✔";
    case "warn":
      return "⚠";
    case "fail":
      return "✗";
  }
}

export const SCORE_CATEGORY_LABELS: Record<ScoreCategory, string> = {
  editorial: "Editorial",
  scientific: "Scientific",
  media: "Media",
  relationships: "Relationships",
  localization: "Localization",
  seo: "SEO",
  knowledge: "Knowledge",
};
