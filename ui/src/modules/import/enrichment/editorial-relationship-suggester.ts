import type { CanonicalLureImport } from "@/modules/import/core/canonical-lure";

/** Advisory relationship hints — never auto-published; consumed by Editorial Intelligence. */
export type EditorialRelationshipHints = {
  techniques?: string[];
  lureCategories?: string[];
  species?: string[];
  regions?: string[];
  waterTypes?: string[];
  seasons?: string[];
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Infer relationship hints only when attributes support them with confidence.
 * Never invent species, regions, or seasons without explicit manufacturer signals.
 */
export function inferRelationshipSuggestions(
  record: CanonicalLureImport,
  techniqueSlugs: string[] = [],
): EditorialRelationshipHints {
  const hints: EditorialRelationshipHints = {};
  const extras = record.metadata.extras ?? {};

  if (techniqueSlugs.length > 0) {
    hints.techniques = techniqueSlugs;
  }

  const bodySlug = record.model.bodyType?.slug;
  if (bodySlug) {
    hints.lureCategories = [bodySlug];
  }

  const speciesTags = (record.tags ?? [])
    .concat(record.model.tags ?? [])
    .filter((tag) => tag.kind === "species" && tag.value.trim())
    .map((tag) => slugify(tag.value));

  if (speciesTags.length > 0) {
    hints.species = [...new Set(speciesTags)];
  }

  const regionTags = [...(record.tags ?? []), ...(record.model.tags ?? [])]
    .filter((tag) => tag.kind === "marketing" && /region:|sea:|coast:/i.test(tag.value))
    .map((tag) => slugify(tag.value.replace(/^[^:]+:/, "")));

  if (regionTags.length > 0) {
    hints.regions = [...new Set(regionTags)];
  }

  const waterTypes = new Set<string>();
  if (extras.topwaterInferred || extras.surface) {
    waterTypes.add("surface");
  }

  const maxDepth =
    record.model.divingDepth?.maxMeters ?? record.model.divingDepth?.range?.max;
  if (typeof maxDepth === "number" && maxDepth >= 5) {
    waterTypes.add("offshore");
  } else if (typeof maxDepth === "number" && maxDepth > 0) {
    waterTypes.add("inshore");
  }

  const buoySlug = record.model.buoyancy?.slug;
  if (buoySlug === "sinking" || buoySlug === "fast-sinking") {
    waterTypes.add("bottom");
  }

  if (waterTypes.size > 0) {
    hints.waterTypes = [...waterTypes];
  }

  const seasonTags = [...(record.tags ?? []), ...(record.model.tags ?? [])]
    .filter((tag) => tag.kind === "marketing" && /season:|spring|summer|autumn|winter/i.test(tag.value))
    .map((tag) => slugify(tag.value.replace(/^[^:]+:/, "")));

  if (seasonTags.length > 0) {
    hints.seasons = [...new Set(seasonTags)];
  }

  return hints;
}
