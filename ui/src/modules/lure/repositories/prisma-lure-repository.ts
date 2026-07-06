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
  buildPublicTrustSummary,
  deriveLastVerifiedAt,
  derivePublicVerificationStatus,
} from "@/modules/trust/lib/compute-product-trust";
import type { LureRepository } from "@/modules/lure/repositories/lure-repository";
import type {
  LocalizedString,
  LureDetail,
  LureDetailParams,
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

function hasLocalized(value: LocalizedString | undefined): boolean {
  return Boolean(value && (value.en.trim() || value.tr.trim()));
}

function hasDivingDepth(depth?: { min: number; max: number }): boolean {
  return Boolean(depth && (depth.min > 0 || depth.max > 0));
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

function mergeTrollingInfo(
  dbTrolling: LureDetail["trolling"],
  enrichmentTrolling: LureDetail["trolling"],
): LureDetail["trolling"] {
  const dbSpeed = dbTrolling?.speedKnots;
  const enrichmentSpeed = enrichmentTrolling?.speedKnots;
  const hasDbSpeed =
    Boolean(dbSpeed && (dbSpeed.min > 0 || dbSpeed.max > 0));
  const hasEnrichmentSpeed =
    Boolean(
      enrichmentSpeed &&
        (enrichmentSpeed.min > 0 || enrichmentSpeed.max > 0),
    );

  if (!hasDbSpeed && !hasEnrichmentSpeed) {
    const leader = hasLocalized(enrichmentTrolling?.leader)
      ? enrichmentTrolling?.leader
      : undefined;
    const mainLine = hasLocalized(enrichmentTrolling?.mainLine)
      ? enrichmentTrolling?.mainLine
      : undefined;
    const notes = hasLocalized(enrichmentTrolling?.notes)
      ? enrichmentTrolling?.notes
      : undefined;

    if (!leader && !mainLine && !notes) {
      return undefined;
    }

    return { leader, mainLine, notes };
  }

  return {
    speedKnots: hasDbSpeed ? dbSpeed : enrichmentSpeed,
    leader: hasLocalized(enrichmentTrolling?.leader)
      ? enrichmentTrolling?.leader
      : undefined,
    mainLine: hasLocalized(enrichmentTrolling?.mainLine)
      ? enrichmentTrolling?.mainLine
      : undefined,
    notes: hasLocalized(enrichmentTrolling?.notes)
      ? enrichmentTrolling?.notes
      : undefined,
  };
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
    return variantProduct.url;
  }

  const modelHero =
    modelImages.find((image) => image.role === "HERO") ?? modelImages[0];
  return modelHero?.url ?? PLACEHOLDER_IMAGE;
}

function mapVariant(
  variant: LureModelRecord["variants"][number],
  modelImages: Image[],
): UiLureVariant {
  return {
    id: variant.slug,
    label: toLocalized(variant.labelEn, variant.labelTr),
    lengthMm: variant.lengthMm ?? 0,
    weightG: variant.weightG ?? 0,
    colorCode: resolveColorCode(variant.color),
    imageSrc: resolveVariantImage(variant.images, modelImages),
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
): LureDetail {
  const enrichment = getLureDetailEnrichment(record.slug, record.updatedAt);
  const variants = record.variants.map((variant) =>
    mapVariant(variant, record.images),
  );
  const defaultVariantId = resolveDefaultVariantId(variants, record.variants);
  const dbSpecies = mapSpeciesLinks(record.lureSpeciesLinks);
  const dbTechniques = mapTechniqueLinks(record.lureTechniques);

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
    slug: record.slug,
    lifecycleState: record.lifecycleState,
    lastImportedAt: record.lastImportedAt,
    editorConfidence: record.editorNote?.confidence ?? null,
    pendingSuggestions: trustContext.pendingSuggestions,
    manufacturerName: record.manufacturer.nameEn,
    publishedAt: trustContext.publishedAt,
    lastVerifiedAt,
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
      divingDepthM: dbDivingDepth ??
        (hasDivingDepth(enrichment.specifications.divingDepthM)
          ? enrichment.specifications.divingDepthM
          : undefined),
      buoyancy: hasLocalized(dbBuoyancy)
        ? dbBuoyancy
        : hasLocalized(enrichment.specifications.buoyancy)
          ? enrichment.specifications.buoyancy
          : undefined,
      action: hasLocalized(dbAction)
        ? dbAction
        : hasLocalized(enrichment.specifications.action)
          ? enrichment.specifications.action
          : undefined,
      bodyType: dbBodyType,
      coatingType: dbCoatingType,
    },
    recommendedSpecies:
      dbSpecies.length > 0
        ? dbSpecies
        : (enrichment.recommendedSpecies ?? []),
    recommendedTechniques:
      dbTechniques.length > 0
        ? dbTechniques
        : (enrichment.recommendedTechniques ?? []),
    trolling: mergeTrollingInfo(mapDbTrolling(record), enrichment.trolling),
    communityStatistics: enrichment.communityStatistics,
    aiInsights: enrichment.aiInsights,
    relatedLures: enrichment.relatedLures,
    sponsoredLinks: enrichment.sponsoredLinks,
    changeHistory: enrichment.changeHistory,
    trust,
    editorialNote: mapEditorialNote(record.editorNote),
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
      const lure = mapRecordToLureDetail(record, trustContext);
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
