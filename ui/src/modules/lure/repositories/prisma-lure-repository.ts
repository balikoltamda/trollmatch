import {
  ColorAliasKind,
  LureSpeciesAssociationKind,
  Prisma,
  type Image,
  type LureModel,
  type LureVariant,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DataFetchResult } from "@/lib/data-result";
import { logServerError } from "@/lib/log-server-error";
import { getLureDetailEnrichment } from "@/modules/lure/data/lure-detail-enrichment";
import {
  PUBLIC_LURE_WHERE,
} from "@/modules/discovery/lib/public-visibility";
import {
  getCommunitySpeciesForLureModel,
  getCommunityStatisticsForLureModel,
  getCommunityTechniquesForLureModel,
} from "@/modules/catch-report/data/community-statistics";
import {
  buildPublicTrustSummary,
  deriveLastVerifiedAt,
  derivePublicVerificationStatus,
} from "@/modules/trust/lib/compute-product-trust";
import { resolvePublicImagePath } from "@/modules/studio/media/lib/media-asset-service";
import type { LureRepository } from "@/modules/lure/repositories/lure-repository";
import type {
  LocalizedString,
  LureDetail,
  LureDetailParams,
  LureRegionalNotesView,
  LureSpecies,
  LureTechnique,
  LureVariant as UiLureVariant,
} from "@/modules/lure/types/lure-detail";
import {
  BALIK_OLTAMDA_EDITORIAL_SLUG,
} from "@/modules/editorial/data/authors";
import type { EditorialNotePreview } from "@/modules/editorial/types";

const PLACEHOLDER_IMAGE = "/lures/placeholder.svg";

type LureModelRecord = LureModel & {
  lifecycleState: LureModel["lifecycleState"];
  editorNote: {
    confidence: import("@/generated/prisma/client").EditorNoteConfidence;
    updatedAt: Date;
    currentRecommendationEn: string | null;
    currentRecommendationTr: string | null;
    shortRecommendationEn: string | null;
    shortRecommendationTr: string | null;
    mediterraneanNotesEn: string | null;
    mediterraneanNotesTr: string | null;
    aegeanNotesEn: string | null;
    aegeanNotesTr: string | null;
    northernCyprusNotesEn: string | null;
    northernCyprusNotesTr: string | null;
  } | null;
  manufacturer: {
    nameEn: string;
    nameTr: string;
  };
  productLine: {
    nameEn: string;
    nameTr: string;
  };
  variants: Array<
    LureVariant & {
      color: {
        slug: string;
        aliases: Array<{ alias: string; kind: ColorAliasKind }>;
      };
      images: Image[];
    }
  >;
  images: Image[];
  lureSpeciesLinks: Array<{
    associationKind: LureSpeciesAssociationKind;
    fishSpecies: {
      id: string;
      slug: string;
      nameEn: string;
      nameTr: string;
    };
  }>;
  lureTechniques: Array<{
    technique: {
      id: string;
      slug: string;
      nameEn: string;
      nameTr: string;
    };
  }>;
};

function toLocalized(nameEn: string, nameTr: string): LocalizedString {
  return { en: nameEn, tr: nameTr };
}

function toOptionalLocalized(
  nameEn?: string | null,
  nameTr?: string | null,
): LocalizedString | undefined {
  const en = nameEn?.trim() ?? "";
  const tr = nameTr?.trim() ?? "";
  if (!en && !tr) {
    return undefined;
  }

  return { en, tr };
}


function mapDbDivingDepth(
  record: LureModel,
): { min: number; max: number } | undefined {
  const min = record.divingDepthMinM ? Number(record.divingDepthMinM) : undefined;
  const max = record.divingDepthMaxM ? Number(record.divingDepthMaxM) : undefined;

  if (min === undefined && max === undefined) {
    return undefined;
  }

  const resolvedMin = min ?? max ?? 0;
  const resolvedMax = max ?? min ?? 0;

  if (resolvedMin === 0 && resolvedMax === 0) {
    return undefined;
  }

  return { min: resolvedMin, max: resolvedMax };
}

function mapDbTrolling(record: LureModel): LureDetail["trolling"] {
  const minKn = record.trollingSpeedMinKn
    ? Number(record.trollingSpeedMinKn)
    : undefined;
  const maxKn = record.trollingSpeedMaxKn
    ? Number(record.trollingSpeedMaxKn)
    : undefined;

  if (minKn === undefined && maxKn === undefined) {
    return undefined;
  }

  return {
    speedKnots: {
      min: minKn ?? maxKn ?? 0,
      max: maxKn ?? minKn ?? 0,
    },
  };
}

function mapRegionalNotes(
  editorNote: LureModelRecord["editorNote"],
): LureRegionalNotesView | null {
  if (!editorNote) return null;

  const mediterranean = toOptionalLocalized(
    editorNote.mediterraneanNotesEn,
    editorNote.mediterraneanNotesTr,
  );
  const aegean = toOptionalLocalized(
    editorNote.aegeanNotesEn,
    editorNote.aegeanNotesTr,
  );
  const northernCyprus = toOptionalLocalized(
    editorNote.northernCyprusNotesEn,
    editorNote.northernCyprusNotesTr,
  );

  if (!mediterranean && !aegean && !northernCyprus) {
    return null;
  }

  return {
    mediterranean: mediterranean ?? null,
    aegean: aegean ?? null,
    northernCyprus: northernCyprus ?? null,
  };
}

function mergeTrollingInfo(dbTrolling: LureDetail["trolling"]): LureDetail["trolling"] {
  if (!dbTrolling?.speedKnots) {
    return undefined;
  }

  const speed = dbTrolling.speedKnots;
  if (speed.min <= 0 && speed.max <= 0) {
    return undefined;
  }

  return dbTrolling;
}

function mapSpeciesKind(
  kind: LureSpeciesAssociationKind,
): LureSpecies["kind"] {
  switch (kind) {
    case LureSpeciesAssociationKind.MANUFACTURER_MARKETING:
      return "marketing";
    case LureSpeciesAssociationKind.COMMUNITY_EFFECTIVENESS:
      return "community";
    case LureSpeciesAssociationKind.MODERATOR_CURATED:
    default:
      return "curated";
  }
}

function resolveColorCode(
  color: LureModelRecord["variants"][number]["color"],
): string {
  const manufacturerCode = color.aliases.find(
    (alias) => alias.kind === ColorAliasKind.MANUFACTURER_CODE,
  );
  if (manufacturerCode) {
    return manufacturerCode.alias;
  }

  const segment = color.slug.split("-").pop();
  return segment?.toUpperCase() ?? color.slug;
}

function resolveVariantImage(
  variantImages: Image[],
  modelImages: Image[],
): string {
  const variantProduct =
    variantImages.find((image) => image.role === "PRODUCT") ??
    variantImages[0];
  if (variantProduct?.url) {
    return resolvePublicImagePath(variantProduct.url);
  }

  const modelHero =
    modelImages.find((image) => image.role === "HERO") ?? modelImages[0];
  return modelHero?.url
    ? resolvePublicImagePath(modelHero.url)
    : PLACEHOLDER_IMAGE;
}

function mapVariantImages(
  variantImages: Image[],
  modelImages: Image[],
): { imageSrc: string; galleryImages: string[] } {
  const galleryImages = variantImages
    .map((image) => resolvePublicImagePath(image.url))
    .filter((url, index, list) => url && list.indexOf(url) === index);

  if (galleryImages.length > 0) {
    return { imageSrc: galleryImages[0]!, galleryImages };
  }

  const fallback = resolveVariantImage([], modelImages);
  return { imageSrc: fallback, galleryImages: [fallback] };
}

function mapVariant(
  variant: LureModelRecord["variants"][number],
  modelImages: Image[],
): UiLureVariant {
  const { imageSrc, galleryImages } = mapVariantImages(
    variant.images,
    modelImages,
  );
  return {
    id: variant.slug,
    label: toLocalized(variant.labelEn, variant.labelTr),
    lengthMm: variant.lengthMm ?? 0,
    weightG: variant.weightG ?? 0,
    colorCode: resolveColorCode(variant.color),
    imageSrc,
    galleryImages,
  };
}

function mapSpeciesLinks(
  links: LureModelRecord["lureSpeciesLinks"],
): LureSpecies[] {
  return links.map((link) => ({
    id: link.fishSpecies.slug,
    name: toLocalized(link.fishSpecies.nameEn, link.fishSpecies.nameTr),
    kind: mapSpeciesKind(link.associationKind),
  }));
}

function mapTechniqueLinks(
  links: LureModelRecord["lureTechniques"],
): LureTechnique[] {
  return links.map((link) => ({
    id: link.technique.slug,
    name: toLocalized(link.technique.nameEn, link.technique.nameTr),
  }));
}

function resolveDefaultVariantId(
  variants: UiLureVariant[],
  modelVariants: LureModelRecord["variants"],
): string {
  const defaultVariant = modelVariants.find((variant) => variant.isDefault);
  if (defaultVariant) {
    return defaultVariant.slug;
  }

  return variants[0]?.id ?? "";
}

function resolveActiveVariant(
  lure: LureDetail,
  variantId?: string,
): UiLureVariant {
  const match = lure.variants.find((variant) => variant.id === variantId);
  if (match) {
    return match;
  }

  return (
    lure.variants.find((variant) => variant.id === lure.defaultVariantId) ??
    lure.variants[0]
  );
}

function mapEditorialNote(
  editorNote: LureModelRecord["editorNote"],
): EditorialNotePreview | null {
  if (!editorNote) return null;

  const en =
    editorNote.currentRecommendationEn?.trim() ||
    editorNote.shortRecommendationEn?.trim() ||
    "";
  const tr =
    editorNote.currentRecommendationTr?.trim() ||
    editorNote.shortRecommendationTr?.trim() ||
    "";

  if (!en && !tr) return null;

  return {
    summary: { en, tr },
    confidence: editorNote.confidence,
    updatedAt: editorNote.updatedAt.toISOString(),
    authorSlug: BALIK_OLTAMDA_EDITORIAL_SLUG,
  };
}

function mapRecordToLureDetail(
  record: LureModelRecord,
  trustContext: { pendingSuggestions: number; publishedAt: Date | null },
  communityContext: {
    communityStatistics: LureDetail["communityStatistics"];
    communitySpecies: LureSpecies[];
    communityTechniques: LureTechnique[];
  },
): LureDetail {
  const enrichment = getLureDetailEnrichment(record.updatedAt);
  const variants = record.variants.map((variant) =>
    mapVariant(variant, record.images),
  );
  const defaultVariantId = resolveDefaultVariantId(variants, record.variants);
  const dbSpecies = mapSpeciesLinks(record.lureSpeciesLinks);
  const dbTechniques = mapTechniqueLinks(record.lureTechniques);
  const dbTechniqueSlugs = dbTechniques.map((technique) => technique.id);

  const defaultVariant =
    variants.find((variant) => variant.id === defaultVariantId) ?? variants[0];

  const dbBuoyancy = toOptionalLocalized(record.buoyancyEn, record.buoyancyTr);
  const dbAction = toOptionalLocalized(record.actionEn, record.actionTr);
  const dbBodyType = toOptionalLocalized(record.bodyTypeEn, record.bodyTypeTr);
  const dbCoatingType = toOptionalLocalized(
    record.coatingTypeEn,
    record.coatingTypeTr,
  );
  const dbDivingDepth = mapDbDivingDepth(record);

  const lastVerifiedAt = deriveLastVerifiedAt({
    lifecycleState: record.lifecycleState,
    publishedAt: trustContext.publishedAt,
    lastImportedAt: record.lastImportedAt,
    editorNoteUpdatedAt: record.editorNote?.updatedAt ?? null,
  });

  const trust = buildPublicTrustSummary({
    lifecycleState: record.lifecycleState,
    lastImportedAt: record.lastImportedAt,
    editorConfidence: record.editorNote?.confidence ?? null,
    pendingSuggestions: trustContext.pendingSuggestions,
    manufacturerName: record.manufacturer.nameEn,
    publishedAt: trustContext.publishedAt,
    lastVerifiedAt,
    communityStatistics: communityContext.communityStatistics,
  });

  const verificationStatus = derivePublicVerificationStatus({
    lifecycleState: record.lifecycleState,
    editorConfidence: record.editorNote?.confidence ?? null,
    lastImportedAt: record.lastImportedAt,
    pendingSuggestions: trustContext.pendingSuggestions,
  });

  return {
    slug: record.slug,
    manufacturer: toLocalized(
      record.manufacturer.nameEn,
      record.manufacturer.nameTr,
    ),
    productLine: toLocalized(
      record.productLine.nameEn,
      record.productLine.nameTr,
    ),
    modelName: toLocalized(record.nameEn, record.nameTr),
    formFactor: toLocalized(
      record.formFactorEn ?? "",
      record.formFactorTr ?? "",
    ),
    shortDescription: toLocalized(
      record.shortDescriptionEn ?? "",
      record.shortDescriptionTr ?? "",
    ),
    verificationStatus,
    lastVerifiedAt,
    defaultVariantId,
    variants,
    specifications: {
      lengthMm: defaultVariant?.lengthMm ?? 0,
      weightG: defaultVariant?.weightG ?? 0,
      divingDepthM: dbDivingDepth,
      buoyancy: dbBuoyancy,
      action: dbAction,
      bodyType: dbBodyType,
      coatingType: dbCoatingType,
    },
    recommendedSpecies: [...dbSpecies, ...communityContext.communitySpecies],
    recommendedTechniques: [
      ...dbTechniques,
      ...communityContext.communityTechniques.filter(
        (technique) => !dbTechniqueSlugs.includes(technique.id),
      ),
    ],
    trolling: mergeTrollingInfo(mapDbTrolling(record)),
    communityStatistics: communityContext.communityStatistics,
    aiInsights: enrichment.aiInsights,
    relatedLures: enrichment.relatedLures,
    sponsoredLinks: enrichment.sponsoredLinks,
    changeHistory: enrichment.changeHistory,
    trust,
    editorialNote: mapEditorialNote(record.editorNote),
    regionalNotes: mapRegionalNotes(record.editorNote),
  };
}

const lureModelInclude = {
  manufacturer: true,
  productLine: true,
  variants: {
    where: { deletedAt: null },
    orderBy: [
      { sortOrder: Prisma.SortOrder.asc },
      { createdAt: Prisma.SortOrder.asc },
    ],
    include: {
      color: {
        include: {
          aliases: {
            where: {
              deletedAt: null,
              kind: ColorAliasKind.MANUFACTURER_CODE,
            },
            take: 1,
          },
        },
      },
      images: {
        where: { deletedAt: null },
        orderBy: { sortOrder: Prisma.SortOrder.asc },
      },
    },
  },
  images: {
    where: { deletedAt: null, lureVariantId: null },
    orderBy: { sortOrder: Prisma.SortOrder.asc },
  },
  lureSpeciesLinks: {
    where: { deletedAt: null },
    include: { fishSpecies: true },
  },
  lureTechniques: {
    where: { deletedAt: null },
    include: { technique: true },
  },
  editorNote: {
    select: {
      confidence: true,
      updatedAt: true,
      currentRecommendationEn: true,
      currentRecommendationTr: true,
      shortRecommendationEn: true,
      shortRecommendationTr: true,
      mediterraneanNotesEn: true,
      mediterraneanNotesTr: true,
      aegeanNotesEn: true,
      aegeanNotesTr: true,
      northernCyprusNotesEn: true,
      northernCyprusNotesTr: true,
    },
  },
} satisfies Prisma.LureModelInclude;

async function loadTrustContext(lureModelId: string) {
  const [pendingSuggestions, publishedEntry] = await Promise.all([
    prisma.catalogSuggestion.count({
      where: { lureModelId, status: "PENDING" },
    }),
    prisma.catalogAuditEntry.findFirst({
      where: { lureModelId, action: "PUBLISH" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);
  return {
    pendingSuggestions,
    publishedAt: publishedEntry?.createdAt ?? null,
  };
}

async function findLureModelBySlug(
  slug: string,
): Promise<LureModelRecord | null> {
  const record = await prisma.lureModel.findFirst({
    where: { slug, ...PUBLIC_LURE_WHERE },
    include: lureModelInclude,
  });

  return record as LureModelRecord | null;
}

export const prismaLureRepository: LureRepository = {
  async getBySlug(params: LureDetailParams) {
    const result = await prismaLureRepository.getBySlugResult(params);
    return result.status === "ok" ? result.data : null;
  },

  async getBySlugResult({
    slug,
    variantId,
  }: LureDetailParams): Promise<DataFetchResult<LureDetail>> {
    try {
      const record = await findLureModelBySlug(slug);
      if (!record || record.variants.length === 0) {
        return { status: "not_found" };
      }

      const trustContext = await loadTrustContext(record.id);
      const dbSpeciesSlugs = record.lureSpeciesLinks.map(
        (link) => link.fishSpecies.slug,
      );
      const dbTechniqueSlugs = record.lureTechniques.map(
        (link) => link.technique.slug,
      );
      const [communityStatistics, communitySpecies, communityTechniques] =
        await Promise.all([
          getCommunityStatisticsForLureModel(record.id),
          getCommunitySpeciesForLureModel(record.id, dbSpeciesSlugs),
          getCommunityTechniquesForLureModel(record.id, dbTechniqueSlugs),
        ]);
      const lure = mapRecordToLureDetail(record, trustContext, {
        communityStatistics,
        communitySpecies,
        communityTechniques,
      });
      const activeVariant = resolveActiveVariant(lure, variantId);

      return {
        status: "ok",
        data: {
          ...lure,
          specifications: {
            ...lure.specifications,
            lengthMm: activeVariant.lengthMm,
            weightG: activeVariant.weightG,
          },
        },
      };
    } catch (error) {
      await logServerError({
        page: "/[locale]/lures/[slug]",
        slug,
        operation: "getLureDetail",
        error,
      });
      return { status: "unavailable" };
    }
  },

  async getAllSlugs() {
    try {
      const models = await prisma.lureModel.findMany({
        where: PUBLIC_LURE_WHERE,
        select: { slug: true },
        orderBy: { slug: "asc" },
      });

      return models.map((model) => model.slug);
    } catch {
      return [];
    }
  },
};
