import type { PrismaClient } from "@/generated/prisma/client";
import type {
  CanonicalHookConfiguration,
  CanonicalLureImport,
  CanonicalLureVariant,
  CanonicalSplitRingConfiguration,
  CanonicalTechnologyRef,
} from "@/modules/import/core/canonical-lure";

type ImportSpecMetadata = {
  hooks?: CanonicalHookConfiguration[];
  splitRings?: CanonicalSplitRingConfiguration[];
  manufacturerNotes?: { en?: string; tr?: string; default?: string };
  featureBlocks?: Array<{ title?: string; body?: string; name?: string; description?: string }>;
  castingRanges?: string[];
  videos?: Array<{ url: string; role?: string; title?: { en?: string } }>;
  downloads?: Array<{ url: string; role?: string; title?: { en?: string } }>;
  editorialRelationshipHints?: Record<string, string[]>;
};

function decimalToNumber(value: { toNumber(): number } | null | undefined): number | undefined {
  if (value == null) return undefined;
  return value.toNumber();
}

function localizedPair(en: string | null, tr: string | null) {
  return { en: en ?? undefined, tr: tr ?? undefined, default: en ?? tr ?? undefined };
}

/** Reconstruct a canonical import row from persisted lure data for backfill / re-enrichment. */
export async function rebuildCanonicalFromLureModel(
  prisma: PrismaClient,
  lureModelId: string,
): Promise<CanonicalLureImport | null> {
  const lure = await prisma.lureModel.findUnique({
    where: { id: lureModelId },
    include: {
      manufacturer: true,
      productLine: true,
      variants: {
        where: { deletedAt: null },
        include: { color: true },
        orderBy: { sortOrder: "asc" },
      },
      lureTechniques: {
        where: { deletedAt: null },
        include: { technique: true },
      },
      technologyLinks: {
        include: { technology: true },
        orderBy: { sortOrder: "asc" },
      },
      images: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      aliases: { where: { deletedAt: null } },
    },
  });

  if (!lure) return null;

  const metadata = (lure.importSpecMetadata as ImportSpecMetadata | null) ?? {};
  const pidAlias = lure.aliases.find((alias) => alias.alias.startsWith("duel:pid:"));
  const pid = pidAlias?.alias.replace(/^duel:pid:/, "") ?? lure.slug;

  const technologies: CanonicalTechnologyRef[] = lure.technologyLinks.map((link) => ({
    slug: link.technology.slug,
    name: localizedPair(link.technology.nameEn, null),
    description: link.technology.descriptionEn
      ? localizedPair(link.technology.descriptionEn, link.technology.descriptionTr)
      : undefined,
  }));

  const variants: CanonicalLureVariant[] = lure.variants.map((variant) => ({
    slug: variant.slug,
    name: localizedPair(variant.labelEn, variant.labelTr),
    colors: [
      {
        code: variant.color.slug.split("-").pop() ?? variant.color.slug,
        name: localizedPair(variant.color.nameEn, variant.color.nameTr),
      },
    ],
    sizes: variant.lengthMm ? [{ lengthMm: variant.lengthMm }] : undefined,
    weights: variant.weightG ? [{ weightG: variant.weightG }] : undefined,
  }));

  if (variants.length === 0) {
    variants.push({
      slug: `${lure.slug}-default`,
      name: localizedPair(lure.nameEn, lure.nameTr),
      colors: [{ code: "DEFAULT", name: { default: "Default" } }],
    });
  }

  return {
    recordKey: pidAlias ? `duel:pid:${pid}` : `lure:${lure.slug}`,
    manufacturer: {
      slug: lure.manufacturer.slug,
      name: localizedPair(lure.manufacturer.nameEn, lure.manufacturer.nameTr),
      countryCode: lure.manufacturer.countryCode ?? undefined,
      website: lure.manufacturer.website ?? undefined,
      logoUrl: lure.manufacturer.logoUrl ?? undefined,
    },
    productLine: {
      slug: lure.productLine.slug,
      name: localizedPair(lure.productLine.nameEn, lure.productLine.nameTr),
    },
    model: {
      slug: lure.slug,
      name: localizedPair(lure.nameEn, lure.nameTr),
      shortDescription: localizedPair(lure.shortDescriptionEn, lure.shortDescriptionTr),
      formFactorTerm: lure.formFactorEn ?? undefined,
      bodyType: lure.bodyTypeSlug
        ? {
            slug: lure.bodyTypeSlug,
            label: localizedPair(lure.bodyTypeEn, lure.bodyTypeTr),
          }
        : undefined,
      buoyancy: lure.buoyancySlug
        ? {
            slug: lure.buoyancySlug,
            label: localizedPair(lure.buoyancyEn, lure.buoyancyTr),
          }
        : undefined,
      divingDepth:
        lure.divingDepthMinM != null || lure.divingDepthMaxM != null
          ? {
              minMeters: decimalToNumber(lure.divingDepthMinM),
              maxMeters: decimalToNumber(lure.divingDepthMaxM),
            }
          : undefined,
      trollingSpeed:
        lure.trollingSpeedMinKn != null || lure.trollingSpeedMaxKn != null
          ? {
              minKnots: decimalToNumber(lure.trollingSpeedMinKn),
              maxKnots: decimalToNumber(lure.trollingSpeedMaxKn),
            }
          : undefined,
      coatingType: lure.coatingTypeSlug
        ? {
            slug: lure.coatingTypeSlug,
            label: localizedPair(lure.coatingTypeEn, lure.coatingTypeTr),
          }
        : undefined,
      actions: lure.actionSlug
        ? [{ slug: lure.actionSlug, label: localizedPair(lure.actionEn, lure.actionTr) }]
        : undefined,
      hooks: metadata.hooks,
      splitRings: metadata.splitRings,
      manufacturerNotes: metadata.manufacturerNotes,
      technologies: technologies.length > 0 ? technologies : undefined,
      techniques: lure.lureTechniques.map((link) => ({
        slug: link.technique.slug,
        label: localizedPair(link.technique.nameEn, link.technique.nameTr),
      })),
      images: lure.images.map((image) => ({
        url: image.url,
        role: image.role.toLowerCase() as "hero" | "product" | "gallery",
        sortOrder: image.sortOrder,
        credit: image.creditEn ? localizedPair(image.creditEn, image.creditTr) : undefined,
        copyright: image.copyrightEn
          ? localizedPair(image.copyrightEn, image.copyrightTr)
          : undefined,
        sourcePageUrl: image.sourceUrl ?? undefined,
      })),
      videos: metadata.videos?.map((video, index) => ({
        url: video.url,
        role: (video.role as "product_demo") ?? "product_demo",
        title: video.title,
        sortOrder: index,
      })),
      downloads: metadata.downloads?.map((download, index) => ({
        url: download.url,
        role: download.role as "manual" | "catalog" | "spec_sheet" | undefined,
        title: download.title,
        sortOrder: index,
      })),
    },
    variants,
    source: {
      url: lure.manufacturer.website ?? "https://trollmatch.local/backfill",
      type: "manufacturer_catalog",
    },
    metadata: {
      providerCode: "backfill",
      sourceRecordId: pid,
      extras: {
        backfillFromDb: true,
        featureBlocks: metadata.featureBlocks,
        castingRanges: metadata.castingRanges,
        editorialRelationshipHints: metadata.editorialRelationshipHints,
      },
    },
    importedAt: new Date().toISOString(),
  };
}
