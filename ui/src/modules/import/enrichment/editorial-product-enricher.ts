import type {
  CanonicalLureImport,
  CanonicalLocalizedText,
  CanonicalTechnologyRef,
} from "@/modules/import/core/canonical-lure";
import {
  BUOYANCY_TR,
  localizeSpecLabel,
  localizeTechnologyDescription,
} from "@/modules/terminology/data/lure-specs";
import { generateEditorialProse } from "@/modules/import/enrichment/editorial-prose";
import {
  inferRelationshipSuggestions,
  type EditorialRelationshipHints,
} from "@/modules/import/enrichment/editorial-relationship-suggester";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type FeatureBlock = {
  title?: string;
  body?: string;
  text?: string;
  name?: string;
  description?: string;
};

/** Extract reusable technology entities from manufacturer feature blocks. */
export function extractTechnologies(record: CanonicalLureImport): CanonicalTechnologyRef[] {
  const fromModel = record.model.technologies ?? [];
  const extras = record.metadata.extras ?? {};
  const blocks = (extras.featureBlocks as FeatureBlock[] | undefined) ?? [];

  const fromBlocks: CanonicalTechnologyRef[] = [];
  for (const block of blocks) {
    const title = (block.title ?? block.name ?? "").trim();
    if (!title) continue;
    const body = (block.body ?? block.text ?? block.description ?? "").trim();
    fromBlocks.push({
      slug: slugify(title),
      name: { en: title, default: title },
      description: body
        ? {
            en: body,
            tr: localizeTechnologyDescription(body),
          }
        : undefined,
    });
  }

  const merged = new Map<string, CanonicalTechnologyRef>();
  for (const tech of [...fromModel, ...fromBlocks]) {
    merged.set(tech.slug, tech);
  }
  return [...merged.values()];
}

/** Range = 0 → infer topwater / surface. */
export function applyTopwaterDetection(record: CanonicalLureImport): CanonicalLureImport {
  const depth = record.model.divingDepth;
  const minM = depth?.minMeters ?? depth?.range?.min;
  const maxM = depth?.maxMeters ?? depth?.range?.max;

  if (minM !== 0 || maxM !== 0) return record;

  return {
    ...record,
    model: {
      ...record.model,
      buoyancy: record.model.buoyancy ?? {
        slug: "floating",
        label: { en: "Floating", tr: BUOYANCY_TR.floating },
      },
      divingDepth: {
        ...depth,
        minMeters: 0,
        maxMeters: 0,
        manufacturerLabel: { en: "Surface", tr: localizeSpecLabel("surface").tr },
      },
      tags: [
        ...(record.model.tags ?? []),
        { kind: "feature", value: "topwater" },
        { kind: "feature", value: "surface" },
      ],
    },
    metadata: {
      ...record.metadata,
      extras: {
        ...record.metadata.extras,
        topwaterInferred: true,
        surface: true,
        minimumDepth: 0,
        maximumDepth: 0,
      },
    },
  };
}

/** Generate localized short descriptions using Turkish fishing terminology. */
export function generateShortDescriptions(
  record: CanonicalLureImport,
): CanonicalLocalizedText {
  return generateEditorialProse(record);
}

/** Infer compatible techniques from parsed product attributes. */
export function inferEditorialTechniques(record: CanonicalLureImport): string[] {
  const slugs = new Set(record.model.techniques?.map((t) => t.slug) ?? []);
  const extras = record.metadata.extras ?? {};

  if (extras.topwaterInferred || extras.surface) {
    slugs.add("topwater");
    slugs.add("surface");
  }

  const buoySlug = record.model.buoyancy?.slug;
  if (buoySlug === "sinking" || buoySlug === "fast-sinking") {
    slugs.add("jigging");
  }

  const maxDepth = record.model.divingDepth?.maxMeters ?? record.model.divingDepth?.range?.max;
  if (typeof maxDepth === "number" && maxDepth >= 3) {
    slugs.add("trolling");
  }

  const castingRanges = record.metadata.extras?.castingRanges as string[] | undefined;
  if (castingRanges?.length) {
    slugs.add("casting");
    slugs.add("shore-fishing");
  }

  for (const tag of record.model.tags ?? []) {
    if (tag.kind === "technique") slugs.add(slugify(tag.value));
  }

  return [...slugs];
}

/** Full editorial enrichment pass — run before validation/persistence. */
export function enrichCanonicalForEditorial(
  record: CanonicalLureImport,
): CanonicalLureImport {
  const enriched = applyTopwaterDetection(record);
  const technologies = extractTechnologies(enriched);
  const shortDescription = generateShortDescriptions({ ...enriched, model: { ...enriched.model, technologies } });
  const techniqueSlugs = inferEditorialTechniques(enriched);
  const relationshipHints = inferRelationshipSuggestions(enriched, techniqueSlugs);

  const techniqueRefs = [
    ...(enriched.model.techniques ?? []),
    ...techniqueSlugs
      .filter((slug) => !enriched.model.techniques?.some((t) => t.slug === slug))
      .map((slug) => ({ slug })),
  ];

  return {
    ...enriched,
    model: {
      ...enriched.model,
      technologies,
      shortDescription,
      techniques: techniqueRefs.length > 0 ? techniqueRefs : enriched.model.techniques,
    },
    metadata: {
      ...enriched.metadata,
      extras: {
        ...enriched.metadata.extras,
        editorialEnrichmentVersion: "7.7.1",
        inferredTechniques: techniqueSlugs,
        editorialRelationshipHints: relationshipHints as EditorialRelationshipHints,
      },
    },
  };
}
