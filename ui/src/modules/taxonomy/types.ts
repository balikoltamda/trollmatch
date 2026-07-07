/**
 * Fish species taxonomy — Sprint 7.4.1
 * Scientific name is canonical. Regional names are country/region scoped only.
 */

export type RegionalNameRef = {
  name: string;
  locale: string;
  countryScope: string;
};

export type SpeciesAliasRef = {
  alias: string;
  kind: string;
  locale: string;
  countryScope: string;
};

export type SpeciesConfusionRef = {
  confusedWithSlug: string;
  confusedWithName: { en: string; tr: string };
  confusedWithScientific: string;
  misappliedName: { en: string | null; tr: string | null };
  reason: { en: string; tr: string };
  countryScope: string;
};

export type SpeciesTaxonomyProfile = {
  slug: string;
  scientificName: string;
  preferredName: { en: string; tr: string };
  aliases: SpeciesAliasRef[];
  regionalNames: RegionalNameRef[];
  confusions: SpeciesConfusionRef[];
  editorialNotes: { en: string | null; tr: string | null };
};

export type SpeciesSearchHit = {
  slug: string;
  slugEn: string;
  slugTr: string;
  scientificName: string;
  preferredName: { en: string; tr: string };
  matchKind:
    | "scientific"
    | "preferred"
    | "alias"
    | "regional"
    | "confusion_misapplied";
  disambiguation: {
    primarySlug: string;
    primaryName: { en: string; tr: string };
    reason: { en: string; tr: string };
  } | null;
};

export type SpeciesSearchResult = {
  query: string;
  hits: SpeciesSearchHit[];
};

/** Allowed regional scopes — country or major region only. Never city-level. */
export const TAXONOMY_REGION_SCOPES = [
  "global",
  "TR",
  "KKTC",
  "GR",
  "IT",
  "ES",
  "CY",
] as const;

export type TaxonomyRegionScope = (typeof TAXONOMY_REGION_SCOPES)[number];
