import type { QualityCheckItem, ScoreBoard } from "@/modules/studio/ai-review/lib/quality-report";

function scoreCategory(checks: QualityCheckItem[], category: QualityCheckItem["category"]): number {
  const subset = checks.filter((c) => c.category === category);
  if (subset.length === 0) return 100;
  const total = subset.reduce((sum, c) => sum + c.weight, 0);
  const earned = subset.reduce((sum, c) => {
    if (c.status === "pass") return sum + c.weight;
    if (c.status === "warn") return sum + c.weight * 0.5;
    return sum;
  }, 0);
  return Math.round((earned / total) * 100);
}

export function computeScoreBoard(checks: QualityCheckItem[]): ScoreBoard {
  const editorial = scoreCategory(checks, "editorial");
  const scientific = scoreCategory(checks, "scientific");
  const media = scoreCategory(checks, "media");
  const relationships = scoreCategory(checks, "relationships");
  const localization = scoreCategory(checks, "localization");
  const seo = scoreCategory(checks, "seo");
  const knowledge = scoreCategory(checks, "knowledge");

  const weights = {
    editorial: 1,
    scientific: 1.2,
    media: 1,
    relationships: 1.1,
    localization: 1,
    seo: 0.8,
    knowledge: 1,
  };
  const overall = Math.round(
    (editorial * weights.editorial +
      scientific * weights.scientific +
      media * weights.media +
      relationships * weights.relationships +
      localization * weights.localization +
      seo * weights.seo +
      knowledge * weights.knowledge) /
      Object.values(weights).reduce((a, b) => a + b, 0),
  );

  const criticalIssues = checks.filter((c) => c.status === "fail").length;
  const warnings = checks.filter((c) => c.status === "warn").length;

  return {
    editorial,
    scientific,
    media,
    relationships,
    localization,
    seo,
    knowledge,
    overall,
    readyForPublication: overall >= 85 && criticalIssues === 0,
    criticalIssues,
    warnings,
  };
}

export function groupChecksByCategory(
  checks: QualityCheckItem[],
): Record<QualityCheckItem["category"], QualityCheckItem[]> {
  const groups: Record<QualityCheckItem["category"], QualityCheckItem[]> = {
    editorial: [],
    scientific: [],
    media: [],
    relationships: [],
    localization: [],
    seo: [],
    knowledge: [],
  };
  for (const check of checks) {
    groups[check.category].push(check);
  }
  return groups;
}
