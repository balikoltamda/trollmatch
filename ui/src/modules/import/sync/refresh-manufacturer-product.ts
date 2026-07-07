import type { PrismaClient } from "@/generated/prisma/client";
import type { ImportFieldChangeKind } from "@/generated/prisma/client";
import type { CanonicalLureImport } from "@/modules/import/core/canonical-lure";
import { generateMissingProductContent } from "@/modules/import/sync/content-generator";
import {
  computeDigitalTwinHashes,
  hashesChanged,
} from "@/modules/import/sync/digital-twin-hashes";
import { persistDigitalTwinMetadata } from "@/modules/import/sync/digital-twin-persistence";
import { upsertCanonicalImport } from "@/modules/import/persistence/canonical-import-persister";
import { fetchDuelProductCanonical } from "@/modules/import/sync/fetch-single-product";
import {
  computeProductSyncDiffs,
  type ExistingProductSnapshot,
  type ProductSyncDiff,
} from "@/modules/import/sync/product-difference-engine";
import {
  createProtectedFieldSuggestions,
  isProtectedFieldKey,
  productHasEditorHero,
} from "@/modules/import/sync/protected-fields";
import {
  resolveManufacturerProductSource,
  type ManufacturerProductSource,
} from "@/modules/import/sync/resolve-manufacturer-source";
import { resolveLocalized } from "@/modules/import/persistence/normalize";
import { triggerEditorialReview } from "@/modules/studio/ai-review/lib/trigger-editorial-review";

export type RefreshManufacturerProductResult = {
  ok: true;
  sourceUrl: string;
  diffCount: number;
  filledShortDescription: boolean;
  filledLongDescription: boolean;
  editorialReviewTriggered: boolean;
  contentUnchanged: boolean;
  generatedFields: string[];
};

function toPrismaChangeKind(
  kind: ProductSyncDiff["changeKind"],
): ImportFieldChangeKind {
  return kind.toUpperCase() as ImportFieldChangeKind;
}

export function generateLongDescriptionDraft(record: CanonicalLureImport): {
  en: string;
  tr: string;
} {
  const notes =
    record.model.manufacturerNotes?.default ??
    record.model.manufacturerNotes?.en ??
    "";
  const shortEn = record.model.shortDescription
    ? resolveLocalized(record.model.shortDescription, "en")
    : "";
  const shortTr = record.model.shortDescription
    ? resolveLocalized(record.model.shortDescription, "tr") || shortEn
    : shortEn;

  if (notes.trim()) {
    return {
      en: notes.trim(),
      tr: record.model.manufacturerNotes?.tr?.trim() || notes.trim(),
    };
  }

  return {
    en: shortEn || resolveLocalized(record.model.name, "en"),
    tr: shortTr || resolveLocalized(record.model.name, "tr") || shortEn,
  };
}

async function loadExistingSnapshot(
  prisma: PrismaClient,
  lureModelId: string,
): Promise<
  | (ExistingProductSnapshot & {
      manufacturerSlug: string;
      aliases: Array<{ alias: string }>;
      contentHash: string | null;
      imageHash: string | null;
      technologyHash: string | null;
      specificationHash: string | null;
      seoTitleEn: string | null;
      seoTitleTr: string | null;
      metaDescriptionEn: string | null;
      metaDescriptionTr: string | null;
      openGraphTitleEn: string | null;
      openGraphTitleTr: string | null;
      openGraphDescriptionEn: string | null;
      openGraphDescriptionTr: string | null;
      editorNote: {
        longRecommendationEn: string | null;
        longRecommendationTr: string | null;
        shortRecommendationEn: string | null;
        currentRecommendationEn: string | null;
      } | null;
    })
  | null
> {
  const row = await prisma.lureModel.findFirst({
    where: { id: lureModelId, deletedAt: null },
    include: {
      manufacturer: { select: { slug: true } },
      aliases: { where: { deletedAt: null } },
      images: {
        where: { deletedAt: null },
        select: { url: true, sourceUrl: true },
      },
      technologyLinks: {
        include: { technology: { select: { slug: true } } },
      },
      variants: { where: { deletedAt: null }, select: { labelEn: true } },
      lureTechniques: {
        where: { deletedAt: null },
        include: { technique: { select: { slug: true } } },
      },
      lureSpeciesLinks: {
        where: { deletedAt: null },
        include: { fishSpecies: { select: { slug: true } } },
      },
      editorNote: {
        select: {
          longRecommendationEn: true,
          longRecommendationTr: true,
          shortRecommendationEn: true,
          currentRecommendationEn: true,
        },
      },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    manufacturerSlug: row.manufacturer.slug,
    aliases: row.aliases.map((a) => ({ alias: a.alias })),
    contentHash: row.contentHash,
    imageHash: row.imageHash,
    technologyHash: row.technologyHash,
    specificationHash: row.specificationHash,
    seoTitleEn: row.seoTitleEn,
    seoTitleTr: row.seoTitleTr,
    metaDescriptionEn: row.metaDescriptionEn,
    metaDescriptionTr: row.metaDescriptionTr,
    openGraphTitleEn: row.openGraphTitleEn,
    openGraphTitleTr: row.openGraphTitleTr,
    openGraphDescriptionEn: row.openGraphDescriptionEn,
    openGraphDescriptionTr: row.openGraphDescriptionTr,
    nameEn: row.nameEn,
    nameTr: row.nameTr,
    shortDescriptionEn: row.shortDescriptionEn,
    shortDescriptionTr: row.shortDescriptionTr,
    formFactorEn: row.formFactorEn,
    formFactorTr: row.formFactorTr,
    bodyTypeSlug: row.bodyTypeSlug,
    bodyTypeEn: row.bodyTypeEn,
    bodyTypeTr: row.bodyTypeTr,
    buoyancySlug: row.buoyancySlug,
    buoyancyEn: row.buoyancyEn,
    buoyancyTr: row.buoyancyTr,
    divingDepthMinM: row.divingDepthMinM,
    divingDepthMaxM: row.divingDepthMaxM,
    trollingSpeedMinKn: row.trollingSpeedMinKn,
    trollingSpeedMaxKn: row.trollingSpeedMaxKn,
    coatingTypeSlug: row.coatingTypeSlug,
    coatingTypeEn: row.coatingTypeEn,
    coatingTypeTr: row.coatingTypeTr,
    actionSlug: row.actionSlug,
    actionEn: row.actionEn,
    actionTr: row.actionTr,
    imageUrls: row.images.map((image) => image.url),
    imageSourceKeys: row.images.map(
      (image) => image.sourceUrl?.trim() || image.url,
    ),
    technologySlugs: row.technologyLinks.map((link) => link.technology.slug),
    variantLabels: row.variants.map((variant) => variant.labelEn),
    techniqueSlugs: row.lureTechniques.map((link) => link.technique.slug),
    speciesSlugs: row.lureSpeciesLinks.map((link) => link.fishSpecies.slug),
    editorNote: row.editorNote,
  };
}

async function recordSyncDiffs(
  prisma: PrismaClient,
  lureModelId: string,
  diffs: ProductSyncDiff[],
  options: { skipHeroImages: boolean },
): Promise<{ recorded: number; protectedSuggestions: number }> {
  const applicable = diffs.filter(
    (diff) =>
      diff.changeKind !== "unchanged" &&
      (diff.fieldKey.startsWith("sync:") ||
        diff.fieldKey.startsWith("seo:") ||
        diff.kind === "conflict"),
  );

  const protectedConflicts: ProductSyncDiff[] = [];
  const toRecord: ProductSyncDiff[] = [];

  for (const diff of applicable) {
    const isHeroImage =
      options.skipHeroImages &&
      diff.fieldKey.startsWith("sync:img:") &&
      diff.fieldLabel.toLowerCase().includes("hero");
    if (isHeroImage) continue;

    if (diff.kind === "conflict" && isProtectedFieldKey(diff.fieldKey)) {
      protectedConflicts.push(diff);
      continue;
    }

    toRecord.push(diff);
  }

  const protectedSuggestions = await createProtectedFieldSuggestions(
    prisma,
    lureModelId,
    protectedConflicts.map((d) => ({
      fieldKey: d.fieldKey,
      fieldLabel: d.fieldLabel,
      oldValue: d.oldValue,
      newValue: d.newValue,
    })),
  );

  if (toRecord.length > 0) {
    await prisma.importFieldChange.createMany({
      data: toRecord.map((diff) => ({
        lureModelId,
        importBatchId: null,
        fieldKey: diff.fieldKey.slice(0, 64),
        fieldLabel: diff.fieldLabel.slice(0, 128),
        oldValue: diff.oldValue,
        newValue: diff.newValue,
        changeKind: toPrismaChangeKind(diff.changeKind),
        status: "PENDING" as const,
      })),
    });
  }

  return { recorded: toRecord.length, protectedSuggestions };
}

async function fetchCanonicalForSource(
  source: ManufacturerProductSource,
  fetchFn?: typeof fetch,
): Promise<CanonicalLureImport> {
  if (source.kind === "duel_pid") {
    return fetchDuelProductCanonical(source.pid, fetchFn);
  }
  throw new Error(source.reason);
}

/** Refresh one product from its manufacturer page — digital twin sync. */
export async function refreshManufacturerProduct(
  prisma: PrismaClient,
  lureModelId: string,
  options: { fetchFn?: typeof fetch; actor?: string } = {},
): Promise<RefreshManufacturerProductResult> {
  const existing = await loadExistingSnapshot(prisma, lureModelId);
  if (!existing) {
    throw new Error("Product not found");
  }

  const source = resolveManufacturerProductSource({
    manufacturerSlug: existing.manufacturerSlug,
    aliases: existing.aliases,
  });
  if (source.kind === "unsupported") {
    throw new Error(source.reason);
  }

  const incoming = await fetchCanonicalForSource(source, options.fetchFn);
  const hashes = computeDigitalTwinHashes(incoming, source.url);
  const contentUnchanged = !hashesChanged(existing, hashes);
  const diffs = computeProductSyncDiffs(existing, incoming);
  const skipHeroImages = await productHasEditorHero(prisma, lureModelId);

  await upsertCanonicalImport(prisma, incoming, new Date(), null);
  const { recorded } = await recordSyncDiffs(prisma, lureModelId, diffs, {
    skipHeroImages,
  });

  const { filledFields } = await generateMissingProductContent(
    prisma,
    lureModelId,
    incoming,
    existing,
  );

  await persistDigitalTwinMetadata(prisma, {
    lureModelId,
    manufacturerUrl: source.url,
    hashes,
    hasPendingChanges: recorded > 0,
    contentUnchanged,
  });

  let editorialReviewTriggered = false;
  try {
    await triggerEditorialReview(
      "LURE",
      lureModelId,
      "IMPORT",
      options.actor ?? "manufacturer-sync",
    );
    editorialReviewTriggered = true;
  } catch {
    editorialReviewTriggered = false;
  }

  return {
    ok: true,
    sourceUrl: source.url,
    diffCount: recorded,
    filledShortDescription: filledFields.some((f) =>
      f.startsWith("shortDescription"),
    ),
    filledLongDescription: filledFields.some((f) =>
      f.startsWith("longRecommendation"),
    ),
    editorialReviewTriggered,
    contentUnchanged,
    generatedFields: filledFields,
  };
}

export { resolveManufacturerProductSource };
