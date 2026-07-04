import type { CanonicalDivingDepth, CanonicalLureImport } from "../core/canonical-lure";

/** Platform buoyancy slugs accepted for publish validation. */
export const KNOWN_BUOYANCY_SLUGS = new Set([
  "floating",
  "suspending",
  "sinking",
  "slow-sinking",
  "fast-sinking",
  "semi-sinking",
  "neutral",
]);

const TOPWATER_TECHNIQUE_SLUGS = new Set(["topwater", "surface", "popping"]);
const TOPWATER_BODY_TYPE_SLUGS = new Set(["popper", "stickbait", "walk-the-dog", "surface"]);
const TOPWATER_FORM_FACTOR_PATTERN = /\btop\s*water\b|\bsurface\b|\bpopper\b|\bpopping\b/i;

const FLOATING_LIKE_SLUGS = new Set(["floating"]);
const SUSPENDING_SLUGS = new Set(["suspending", "neutral"]);
const SINKING_SLUGS = new Set([
  "sinking",
  "slow-sinking",
  "fast-sinking",
  "semi-sinking",
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function resolveDepthMeters(depth: CanonicalDivingDepth | undefined): {
  min?: number;
  max?: number;
} {
  if (!depth) {
    return {};
  }

  const min =
    depth.minMeters ??
    depth.range?.min ??
    (depth.ratedDepthMeters !== undefined ? depth.ratedDepthMeters : undefined);
  const max =
    depth.maxMeters ??
    depth.range?.max ??
    (depth.ratedDepthMeters !== undefined ? depth.ratedDepthMeters : undefined);

  return { min, max };
}

/** True when a non-surface diving depth is present. */
export function hasMeaningfulDivingDepth(depth: CanonicalDivingDepth | undefined): boolean {
  const { min, max } = resolveDepthMeters(depth);
  const resolvedMin = min ?? max;
  const resolvedMax = max ?? min;

  if (resolvedMin === undefined && resolvedMax === undefined) {
    return false;
  }

  return (resolvedMax ?? 0) > 0 || (resolvedMin ?? 0) > 0;
}

function collectTechniqueSlugs(record: CanonicalLureImport): Set<string> {
  const slugs = new Set<string>();

  for (const ref of record.model.techniques ?? []) {
    if (isNonEmptyString(ref.slug)) {
      slugs.add(ref.slug.trim().toLowerCase());
    }
  }

  const tagSources = [
    ...(record.tags ?? []),
    ...(record.model.tags ?? []),
    ...record.variants.flatMap((variant) => variant.tags ?? []),
  ];

  for (const tag of tagSources) {
    if (tag.kind === "technique" && isNonEmptyString(tag.value)) {
      slugs.add(tag.value.trim().toLowerCase());
    }
  }

  return slugs;
}

function resolveBuoyancySlug(record: CanonicalLureImport): string | undefined {
  const modelSlug = record.model.buoyancy?.slug?.trim().toLowerCase();
  if (modelSlug) {
    return modelSlug;
  }

  for (const variant of record.variants) {
    const variantSlug = variant.buoyancy?.slug?.trim().toLowerCase();
    if (variantSlug) {
      return variantSlug;
    }
  }

  return undefined;
}

/** Topwater lures must not carry a diving depth range. */
export function isTopwaterLure(record: CanonicalLureImport): boolean {
  const techniques = collectTechniqueSlugs(record);
  if ([...techniques].some((slug) => TOPWATER_TECHNIQUE_SLUGS.has(slug))) {
    return true;
  }

  const bodySlug = record.model.bodyType?.slug?.trim().toLowerCase();
  if (bodySlug && TOPWATER_BODY_TYPE_SLUGS.has(bodySlug)) {
    return true;
  }

  const formFactor = [
    record.model.formFactorSlug,
    record.model.formFactorTerm,
  ]
    .filter(isNonEmptyString)
    .join(" ");

  return TOPWATER_FORM_FACTOR_PATTERN.test(formFactor);
}

export function recordHasMeaningfulDivingDepth(record: CanonicalLureImport): boolean {
  if (hasMeaningfulDivingDepth(record.model.divingDepth)) {
    return true;
  }

  return record.variants.some((variant) => hasMeaningfulDivingDepth(variant.divingDepth));
}

export function isKnownBuoyancySlug(slug: string | undefined): boolean {
  if (!slug) {
    return false;
  }

  return KNOWN_BUOYANCY_SLUGS.has(slug.trim().toLowerCase());
}

export function validateBuoyancyDepthConsistency(
  buoyancySlug: string | undefined,
  record: CanonicalLureImport,
): { code: string; message: string; fieldPath: string } | null {
  if (!buoyancySlug || !isKnownBuoyancySlug(buoyancySlug)) {
    return null;
  }

  const slug = buoyancySlug.trim().toLowerCase();
  const depth = record.model.divingDepth;
  const { min, max } = resolveDepthMeters(depth);
  const resolvedMax = max ?? min ?? 0;

  if (FLOATING_LIKE_SLUGS.has(slug) && resolvedMax > 0.5) {
    return {
      code: "CANONICAL_BUOYANCY_DEPTH",
      message: "Floating lures must not specify a diving depth greater than 0.5 m",
      fieldPath: "model.divingDepth",
    };
  }

  if (SUSPENDING_SLUGS.has(slug) && resolvedMax > 3) {
    return {
      code: "CANONICAL_BUOYANCY_DEPTH",
      message: "Suspending lures must not specify a diving depth greater than 3 m",
      fieldPath: "model.divingDepth",
    };
  }

  if (SINKING_SLUGS.has(slug) && !recordHasMeaningfulDivingDepth(record)) {
    return {
      code: "CANONICAL_SINKING_DEPTH",
      message: "Sinking lures should specify a diving depth range",
      fieldPath: "model.divingDepth",
    };
  }

  return null;
}

export function resolveRecordBuoyancySlug(record: CanonicalLureImport): string | undefined {
  return resolveBuoyancySlug(record);
}
