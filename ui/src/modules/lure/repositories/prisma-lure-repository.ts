import {
  ColorAliasKind,
  LureSpeciesAssociationKind,
  Prisma,
  type Image,
  type LureModel,
  type LureVariant,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getLureDetailEnrichment } from "@/modules/lure/data/lure-detail-enrichment";
import type { LureRepository } from "@/modules/lure/repositories/lure-repository";
import type {
  LocalizedString,
  LureDetail,
  LureDetailParams,
  LureSpecies,
  LureTechnique,
  LureVariant as UiLureVariant,
} from "@/modules/lure/types/lure-detail";

const PLACEHOLDER_IMAGE = "/lures/placeholder.svg";

type LureModelRecord = LureModel & {
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

function mapRecordToLureDetail(record: LureModelRecord): LureDetail {
  const enrichment = getLureDetailEnrichment(record.slug, record.updatedAt);
  const variants = record.variants.map((variant) =>
    mapVariant(variant, record.images),
  );
  const defaultVariantId = resolveDefaultVariantId(variants, record.variants);
  const dbSpecies = mapSpeciesLinks(record.lureSpeciesLinks);
  const dbTechniques = mapTechniqueLinks(record.lureTechniques);

  const defaultVariant =
    variants.find((variant) => variant.id === defaultVariantId) ?? variants[0];

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
    verificationStatus: enrichment.verificationStatus,
    lastVerifiedAt: enrichment.lastVerifiedAt,
    defaultVariantId,
    variants,
    specifications: {
      lengthMm: defaultVariant?.lengthMm ?? 0,
      weightG: defaultVariant?.weightG ?? 0,
      divingDepthM: enrichment.specifications.divingDepthM,
      buoyancy: enrichment.specifications.buoyancy,
      action: enrichment.specifications.action,
    },
    recommendedSpecies:
      dbSpecies.length > 0
        ? dbSpecies
        : (enrichment.recommendedSpecies ?? []),
    recommendedTechniques:
      dbTechniques.length > 0
        ? dbTechniques
        : (enrichment.recommendedTechniques ?? []),
    trolling: enrichment.trolling,
    communityStatistics: enrichment.communityStatistics,
    aiInsights: enrichment.aiInsights,
    relatedLures: enrichment.relatedLures,
    sponsoredLinks: enrichment.sponsoredLinks,
    changeHistory: enrichment.changeHistory,
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
} satisfies Prisma.LureModelInclude;

async function findLureModelBySlug(
  slug: string,
): Promise<LureModelRecord | null> {
  const record = await prisma.lureModel.findFirst({
    where: { slug, deletedAt: null },
    include: lureModelInclude,
  });

  return record as LureModelRecord | null;
}

export const prismaLureRepository: LureRepository = {
  async getBySlug({ slug, variantId }: LureDetailParams) {
    try {
      const record = await findLureModelBySlug(slug);
      if (!record || record.variants.length === 0) {
        return null;
      }

      const lure = mapRecordToLureDetail(record);
      const activeVariant = resolveActiveVariant(lure, variantId);

      return {
        ...lure,
        specifications: {
          ...lure.specifications,
          lengthMm: activeVariant.lengthMm,
          weightG: activeVariant.weightG,
        },
      };
    } catch {
      return null;
    }
  },

  async getAllSlugs() {
    try {
      const models = await prisma.lureModel.findMany({
        where: { deletedAt: null },
        select: { slug: true },
        orderBy: { slug: "asc" },
      });

      return models.map((model) => model.slug);
    } catch {
      return [];
    }
  },
};
