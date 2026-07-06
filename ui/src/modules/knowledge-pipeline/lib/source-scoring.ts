import type { KnowledgeSourceType } from "@/generated/prisma/client";

/** Source intelligence categories — score only, no AI. */
export type SourceScoreCategory =
  | "MANUFACTURER"
  | "SCIENTIFIC_PUBLICATION"
  | "OFFICIAL_DOCUMENTATION"
  | "BALIK_OLTAMDA"
  | "TRUSTED_FORUM"
  | "GENERAL_FORUM"
  | "COMMUNITY"
  | "UNKNOWN";

export const SOURCE_SCORE_CATEGORY_LABELS: Record<SourceScoreCategory, string> = {
  MANUFACTURER: "Manufacturer",
  SCIENTIFIC_PUBLICATION: "Scientific publication",
  OFFICIAL_DOCUMENTATION: "Official documentation",
  BALIK_OLTAMDA: "Balık Oltamda",
  TRUSTED_FORUM: "Trusted forum",
  GENERAL_FORUM: "General forum",
  COMMUNITY: "Community",
  UNKNOWN: "Unknown",
};

/** Base scores per category (0–100). */
export const SOURCE_CATEGORY_SCORES: Record<SourceScoreCategory, number> = {
  MANUFACTURER: 95,
  SCIENTIFIC_PUBLICATION: 90,
  OFFICIAL_DOCUMENTATION: 85,
  BALIK_OLTAMDA: 80,
  TRUSTED_FORUM: 65,
  GENERAL_FORUM: 45,
  COMMUNITY: 35,
  UNKNOWN: 20,
};

export type SourceScoreInput = {
  sourceType: KnowledgeSourceType;
  sourceSlug: string;
  trustTier: number;
};

export type SourceScoreResult = {
  category: SourceScoreCategory;
  categoryLabel: string;
  baseScore: number;
  /** Final score 0–100 after trust-tier adjustment. */
  score: number;
};

const BALIK_OLTAMDA_SLUGS = new Set([
  "community-catch-reports",
  "balik-oltamda",
  "balikoltamda",
]);

export function resolveSourceScoreCategory(
  sourceType: KnowledgeSourceType,
  sourceSlug: string,
  trustTier = 3,
): SourceScoreCategory {
  if (BALIK_OLTAMDA_SLUGS.has(sourceSlug)) {
    return "BALIK_OLTAMDA";
  }

  switch (sourceType) {
    case "MANUFACTURER":
      return "MANUFACTURER";
    case "SCIENTIFIC_PUBLICATION":
      return "SCIENTIFIC_PUBLICATION";
    case "MAGAZINE":
    case "PUBLIC_ARTICLE":
      return "OFFICIAL_DOCUMENTATION";
    case "COMMUNITY":
      return "COMMUNITY";
    case "FISHING_FORUM":
      return trustTier >= 4 ? "TRUSTED_FORUM" : "GENERAL_FORUM";
    case "FISHING_BLOG":
    case "YOUTUBE":
      return "GENERAL_FORUM";
    default:
      return "UNKNOWN";
  }
}

/** Trust tier 1–5 nudges score ±0–8 points. */
function trustTierAdjustment(trustTier: number): number {
  const clamped = Math.min(5, Math.max(1, trustTier));
  return (clamped - 3) * 4;
}

export function computeSourceScore(input: SourceScoreInput): SourceScoreResult {
  const category = resolveSourceScoreCategory(
    input.sourceType,
    input.sourceSlug,
    input.trustTier,
  );
  const baseScore = SOURCE_CATEGORY_SCORES[category];
  const adjusted = Math.min(
    100,
    Math.max(0, baseScore + trustTierAdjustment(input.trustTier)),
  );

  return {
    category,
    categoryLabel: SOURCE_SCORE_CATEGORY_LABELS[category],
    baseScore,
    score: adjusted,
  };
}
