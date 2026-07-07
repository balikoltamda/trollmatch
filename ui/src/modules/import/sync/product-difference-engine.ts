import type { CanonicalLureImport } from "@/modules/import/core/canonical-lure";
import { pickFillMissingFields } from "@/modules/import/persistence/fill-missing-fields";
import { IMPORT_FIELD_LABELS } from "@/modules/import/persistence/import-field-diff";
import { classifyChangeKind } from "@/modules/import/sync/protected-fields";

function toDiffChangeKind(
  oldValue: string | null,
  newValue: string | null,
): ProductSyncDiffChangeKind {
  return classifyChangeKind({ oldValue, newValue }).toLowerCase() as ProductSyncDiffChangeKind;
}

function pushDiff(
  diffs: ProductSyncDiff[],
  diff: Omit<ProductSyncDiff, "changeKind">,
): void {
  if (toDiffChangeKind(diff.oldValue, diff.newValue) === "unchanged") return;
  diffs.push({
    ...diff,
    changeKind: toDiffChangeKind(diff.oldValue, diff.newValue),
  });
}

export type ProductSyncDiffCategory =
  | "specification"
  | "technology"
  | "description"
  | "image"
  | "variant"
  | "media"
  | "seo"
  | "relationship";

export type ProductSyncDiffChangeKind = "added" | "updated" | "removed" | "unchanged";

export type ProductSyncDiff = {
  fieldKey: string;
  fieldLabel: string;
  category: ProductSyncDiffCategory;
  oldValue: string | null;
  newValue: string | null;
  /** Fill = empty field would be populated; conflict = editor value differs. */
  kind: "fill" | "conflict";
  changeKind: ProductSyncDiffChangeKind;
};

const MODEL_COMPARE_KEYS = [
  "nameEn",
  "nameTr",
  "formFactorEn",
  "formFactorTr",
  "bodyTypeSlug",
  "bodyTypeEn",
  "bodyTypeTr",
  "buoyancySlug",
  "buoyancyEn",
  "buoyancyTr",
  "divingDepthMinM",
  "divingDepthMaxM",
  "trollingSpeedMinKn",
  "trollingSpeedMaxKn",
  "coatingTypeSlug",
  "coatingTypeEn",
  "coatingTypeTr",
  "actionSlug",
  "actionEn",
  "actionTr",
  "shortDescriptionEn",
  "shortDescriptionTr",
] as const;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function decimalString(value: { toString(): string } | null | undefined): string | null {
  return value != null ? value.toString() : null;
}

export type ExistingProductSnapshot = {
  id: string;
  nameEn: string;
  nameTr: string;
  shortDescriptionEn: string | null;
  shortDescriptionTr: string | null;
  formFactorEn: string | null;
  formFactorTr: string | null;
  bodyTypeSlug: string | null;
  bodyTypeEn: string | null;
  bodyTypeTr: string | null;
  buoyancySlug: string | null;
  buoyancyEn: string | null;
  buoyancyTr: string | null;
  divingDepthMinM: { toString(): string } | null;
  divingDepthMaxM: { toString(): string } | null;
  trollingSpeedMinKn: { toString(): string } | null;
  trollingSpeedMaxKn: { toString(): string } | null;
  coatingTypeSlug: string | null;
  coatingTypeEn: string | null;
  coatingTypeTr: string | null;
  actionSlug: string | null;
  actionEn: string | null;
  actionTr: string | null;
  imageUrls: string[];
  /** Manufacturer source URLs (or local url fallback) for sync comparison. */
  imageSourceKeys: string[];
  technologySlugs: string[];
  variantLabels: string[];
  techniqueSlugs: string[];
  speciesSlugs: string[];
};

function buildModelPayload(
  incoming: CanonicalLureImport,
): Record<string, unknown> {
  const model = incoming.model;
  const depth = model.divingDepth;
  const minM = depth?.minMeters ?? depth?.range?.min;
  const maxM = depth?.maxMeters ?? depth?.range?.max;
  const primaryAction = model.actions?.[0];

  return {
    nameEn: model.name.en ?? model.name.default ?? null,
    nameTr: model.name.tr ?? null,
    formFactorEn: model.formFactorTerm ?? null,
    formFactorTr: model.formFactorTerm ?? null,
    bodyTypeSlug: model.bodyType?.slug ?? null,
    bodyTypeEn: model.bodyType?.label?.en ?? model.bodyType?.manufacturerTerm ?? null,
    bodyTypeTr: model.bodyType?.label?.tr ?? null,
    buoyancySlug: model.buoyancy?.slug ?? null,
    buoyancyEn: model.buoyancy?.label?.en ?? model.buoyancy?.manufacturerTerm ?? null,
    buoyancyTr: model.buoyancy?.label?.tr ?? null,
    divingDepthMinM: minM ?? null,
    divingDepthMaxM: maxM ?? null,
    trollingSpeedMinKn: model.trollingSpeed?.minKnots ?? null,
    trollingSpeedMaxKn: model.trollingSpeed?.maxKnots ?? null,
    coatingTypeSlug: model.coatingType?.slug ?? null,
    coatingTypeEn: model.coatingType?.label?.en ?? null,
    coatingTypeTr: model.coatingType?.label?.tr ?? null,
    actionSlug: primaryAction?.slug ?? null,
    actionEn: primaryAction?.label?.en ?? primaryAction?.manufacturerTerm ?? null,
    actionTr: primaryAction?.label?.tr ?? null,
    shortDescriptionEn: model.shortDescription?.en ?? null,
    shortDescriptionTr: model.shortDescription?.tr ?? null,
  };
}

/** Compare persisted product state with incoming manufacturer canonical row. */
export function computeProductSyncDiffs(
  existing: ExistingProductSnapshot,
  incoming: CanonicalLureImport,
): ProductSyncDiff[] {
  const diffs: ProductSyncDiff[] = [];

  const existingModel = {
    nameEn: existing.nameEn,
    nameTr: existing.nameTr,
    formFactorEn: existing.formFactorEn,
    formFactorTr: existing.formFactorTr,
    bodyTypeSlug: existing.bodyTypeSlug,
    bodyTypeEn: existing.bodyTypeEn,
    bodyTypeTr: existing.bodyTypeTr,
    buoyancySlug: existing.buoyancySlug,
    buoyancyEn: existing.buoyancyEn,
    buoyancyTr: existing.buoyancyTr,
    divingDepthMinM: decimalString(existing.divingDepthMinM),
    divingDepthMaxM: decimalString(existing.divingDepthMaxM),
    trollingSpeedMinKn: decimalString(existing.trollingSpeedMinKn),
    trollingSpeedMaxKn: decimalString(existing.trollingSpeedMaxKn),
    coatingTypeSlug: existing.coatingTypeSlug,
    coatingTypeEn: existing.coatingTypeEn,
    coatingTypeTr: existing.coatingTypeTr,
    actionSlug: existing.actionSlug,
    actionEn: existing.actionEn,
    actionTr: existing.actionTr,
    shortDescriptionEn: existing.shortDescriptionEn,
    shortDescriptionTr: existing.shortDescriptionTr,
  };

  const incomingModel = buildModelPayload(incoming);
  const { fill, conflicts } = pickFillMissingFields(
    existingModel,
    incomingModel,
    [...MODEL_COMPARE_KEYS],
  );

  for (const [fieldKey, newValue] of Object.entries(fill)) {
    pushDiff(diffs, {
      fieldKey,
      fieldLabel: IMPORT_FIELD_LABELS[fieldKey] ?? fieldKey,
      category: fieldKey.startsWith("shortDescription") ? "description" : "specification",
      oldValue: null,
      newValue: newValue != null ? String(newValue) : null,
      kind: "fill",
    });
  }

  for (const [fieldKey, newValue] of Object.entries(conflicts)) {
    pushDiff(diffs, {
      fieldKey,
      fieldLabel: IMPORT_FIELD_LABELS[fieldKey] ?? fieldKey,
      category: fieldKey.startsWith("shortDescription") ? "description" : "specification",
      oldValue: existingModel[fieldKey as keyof typeof existingModel] as string | null,
      newValue: newValue != null ? String(newValue) : null,
      kind: "conflict",
    });
  }

  const incomingTech = incoming.model.technologies ?? [];
  for (const tech of incomingTech) {
    if (!existing.technologySlugs.includes(tech.slug)) {
      pushDiff(diffs, {
        fieldKey: `sync:tech:${tech.slug}`,
        fieldLabel: `Technology: ${tech.name.en ?? tech.slug}`,
        category: "technology",
        oldValue: null,
        newValue: tech.slug,
        kind: "fill",
      });
    }
  }

  const incomingImages = [
    ...(incoming.model.images ?? []),
    ...incoming.variants.flatMap((variant) => variant.images ?? []),
  ];
  const seenImages = new Set([
    ...existing.imageSourceKeys,
    ...existing.imageUrls,
  ]);
  for (const image of incomingImages) {
    const sourceKey = image.sourcePageUrl?.trim() || image.url.trim();
    if (!seenImages.has(sourceKey)) {
      pushDiff(diffs, {
        fieldKey: `sync:img:${slugify(sourceKey)}`,
        fieldLabel: `Image: ${image.role ?? "product"}`,
        category: "image",
        oldValue: null,
        newValue: sourceKey,
        kind: "fill",
      });
      seenImages.add(sourceKey);
    }
  }

  for (const variant of incoming.variants) {
    const label = variant.name.en ?? variant.name.default ?? variant.slug;
    if (!existing.variantLabels.some((v) => v.toLowerCase() === label.toLowerCase())) {
      pushDiff(diffs, {
        fieldKey: `sync:var:${slugify(variant.slug)}`,
        fieldLabel: `Variant: ${label}`,
        category: "variant",
        oldValue: null,
        newValue: label,
        kind: "fill",
      });
    }
  }

  for (const video of incoming.model.videos ?? []) {
    pushDiff(diffs, {
      fieldKey: `sync:media:${slugify(video.url)}`,
      fieldLabel: "Manufacturer video",
      category: "media",
      oldValue: null,
      newValue: video.url,
      kind: "fill",
    });
  }

  for (const download of incoming.model.downloads ?? []) {
    pushDiff(diffs, {
      fieldKey: `sync:dl:${slugify(download.url)}`,
      fieldLabel: `Download: ${download.role ?? "manual"}`,
      category: "media",
      oldValue: null,
      newValue: download.url,
      kind: "fill",
    });
  }

  const hints = incoming.metadata.extras?.editorialRelationshipHints as
    | Record<string, string[]>
    | undefined;
  if (hints?.techniques?.length) {
    for (const slug of hints.techniques) {
      if (!existing.techniqueSlugs.includes(slug)) {
        pushDiff(diffs, {
          fieldKey: `sync:rel:technique:${slug}`,
          fieldLabel: `Suggested technique: ${slug}`,
          category: "relationship",
          oldValue: null,
          newValue: slug,
          kind: "fill",
        });
      }
    }
  }

  if (hints?.species?.length) {
    for (const slug of hints.species) {
      if (!existing.speciesSlugs.includes(slug)) {
        pushDiff(diffs, {
          fieldKey: `sync:rel:species:${slug}`,
          fieldLabel: `Suggested species: ${slug}`,
          category: "relationship",
          oldValue: null,
          newValue: slug,
          kind: "fill",
        });
      }
    }
  }

  if (!existing.shortDescriptionEn && incomingModel.shortDescriptionEn) {
    pushDiff(diffs, {
      fieldKey: "seo:shortDescriptionEn",
      fieldLabel: "SEO — short description (EN)",
      category: "seo",
      oldValue: null,
      newValue: String(incomingModel.shortDescriptionEn),
      kind: "fill",
    });
  }
  if (!existing.shortDescriptionTr && incomingModel.shortDescriptionTr) {
    pushDiff(diffs, {
      fieldKey: "seo:shortDescriptionTr",
      fieldLabel: "SEO — short description (TR)",
      category: "seo",
      oldValue: null,
      newValue: String(incomingModel.shortDescriptionTr),
      kind: "fill",
    });
  }

  return diffs;
}
