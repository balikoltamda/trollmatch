import type { StudioReviewEntityType } from "@/generated/prisma/client";

const ENTITY_TYPE_SLUG: Record<StudioReviewEntityType, string> = {
  SPECIES: "species",
  TECHNIQUE: "technique",
  MANUFACTURER: "manufacturer",
  LURE: "lure",
  LURE_VARIANT: "lure-variant",
  PRODUCT_LINE: "product-line",
  KNOWLEDGE_SOURCE: "knowledge-source",
  REGION: "region",
  CATCH_REPORT: "catch-report",
};

const ISSUE_KEY_OVERRIDES: Record<string, string> = {
  hero: "missing-hero-image",
  gallery: "missing-gallery",
  credits: "missing-credits",
  copyright: "missing-copyright",
  nameTr: "missing-turkish-translation",
  nameEn: "missing-english-translation",
  scientific: "missing-scientific-name",
  regions: "missing-regions",
  techniques: "missing-techniques",
  openGraph: "missing-opengraph",
  structuredData: "missing-structured-data",
  dupSlug: "duplicate-slug",
  duplicate: "possible-duplicate",
  "graph.lures": "missing-lure-links",
  "graph.techniques": "missing-technique-links",
  "graph.regions": "missing-regions",
  "graph.knowledge": "missing-knowledge-sources",
  "graph.catchReports": "missing-catch-reports",
  "integrity.brokenFk": "broken-foreign-key",
  "integrity.orphan": "orphan-record",
  "integrity.circular": "circular-reference",
};

function toIssueKey(raw: string): string {
  if (ISSUE_KEY_OVERRIDES[raw]) return ISSUE_KEY_OVERRIDES[raw];
  return raw
    .replace(/^graph\./, "")
    .replace(/\./g, "-")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

/** Deterministic fingerprint — e.g. species:akya:missing-hero-image */
export function buildIssueFingerprint(
  entityType: StudioReviewEntityType,
  entitySlug: string,
  issueKey: string,
): string {
  const typeSlug = ENTITY_TYPE_SLUG[entityType];
  const slug = entitySlug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `${typeSlug}:${slug}:${toIssueKey(issueKey)}`;
}

export function buildCheckFingerprint(
  entityType: StudioReviewEntityType,
  entitySlug: string,
  checkId: string,
): string {
  return buildIssueFingerprint(entityType, entitySlug, checkId);
}

export function buildSuggestionFingerprint(
  entityType: StudioReviewEntityType,
  entitySlug: string,
  fieldKey: string,
): string {
  return buildIssueFingerprint(entityType, entitySlug, `suggestion-${fieldKey}`);
}

export function buildDuplicateFingerprint(
  entityType: StudioReviewEntityType,
  entitySlug: string,
): string {
  return buildIssueFingerprint(entityType, entitySlug, "duplicate");
}
