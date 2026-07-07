import type { StudioReviewEntityType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Build seed input from an existing entity for auto-review on edit. */
export async function buildEntitySnapshot(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<Record<string, unknown> | null> {
  switch (entityType) {
    case "SPECIES": {
      const row = await prisma.fishSpecies.findUnique({
        where: { id: entityId },
        select: { nameTr: true, nameEn: true, scientificName: true },
      });
      return row;
    }
    case "TECHNIQUE": {
      const row = await prisma.technique.findUnique({
        where: { id: entityId },
        select: { nameTr: true, nameEn: true },
      });
      return row;
    }
    case "MANUFACTURER": {
      const row = await prisma.manufacturer.findUnique({
        where: { id: entityId },
        select: { nameEn: true, nameTr: true },
      });
      return row;
    }
    case "LURE": {
      const row = await prisma.lureModel.findUnique({
        where: { id: entityId },
        select: {
          nameEn: true,
          nameTr: true,
          shortDescriptionEn: true,
          shortDescriptionTr: true,
          formFactorEn: true,
          bodyTypeSlug: true,
          bodyTypeEn: true,
          buoyancySlug: true,
          buoyancyEn: true,
          divingDepthMinM: true,
          divingDepthMaxM: true,
          actionSlug: true,
          actionEn: true,
          trollingSpeedMinKn: true,
          trollingSpeedMaxKn: true,
          coatingTypeSlug: true,
          importSpecMetadata: true,
          manufacturer: { select: { slug: true, nameEn: true } },
          productLine: { select: { slug: true, nameEn: true } },
          variants: {
            where: { deletedAt: null },
            select: { lengthMm: true, weightG: true, labelEn: true },
            take: 3,
          },
          lureTechniques: {
            where: { deletedAt: null },
            select: { technique: { select: { slug: true, nameEn: true } } },
          },
          lureSpeciesLinks: {
            where: { deletedAt: null },
            select: { fishSpecies: { select: { slug: true } } },
          },
          technologyLinks: {
            select: { technology: { select: { slug: true, nameEn: true } } },
          },
          images: {
            where: { deletedAt: null },
            select: { role: true },
            take: 5,
          },
        },
      });
      if (!row) return null;
      const importMeta = (row.importSpecMetadata as Record<string, unknown> | null) ?? {};
      const relationshipHints = importMeta.editorialRelationshipHints as
        | Record<string, string[]>
        | undefined;
      return {
        nameEn: row.nameEn,
        nameTr: row.nameTr,
        shortDescriptionEn: row.shortDescriptionEn,
        shortDescriptionTr: row.shortDescriptionTr,
        manufacturerSlug: row.manufacturer.slug,
        manufacturerName: row.manufacturer.nameEn,
        productLineSlug: row.productLine.slug,
        productLineName: row.productLine.nameEn,
        formFactorEn: row.formFactorEn,
        bodyTypeSlug: row.bodyTypeSlug,
        bodyTypeEn: row.bodyTypeEn,
        buoyancySlug: row.buoyancySlug,
        buoyancyEn: row.buoyancyEn,
        divingDepthMinM: row.divingDepthMinM?.toNumber() ?? null,
        divingDepthMaxM: row.divingDepthMaxM?.toNumber() ?? null,
        actionSlug: row.actionSlug,
        actionEn: row.actionEn,
        trollingSpeedMinKn: row.trollingSpeedMinKn?.toNumber() ?? null,
        trollingSpeedMaxKn: row.trollingSpeedMaxKn?.toNumber() ?? null,
        coatingTypeSlug: row.coatingTypeSlug,
        importSpecMetadata: row.importSpecMetadata,
        editorialRelationshipHints: relationshipHints,
        variantCount: row.variants.length,
        primaryLengthMm: row.variants[0]?.lengthMm ?? null,
        primaryWeightG: row.variants[0]?.weightG ?? null,
        techniqueSlugs: row.lureTechniques.map((link) => link.technique.slug),
        speciesSlugs: row.lureSpeciesLinks.map((link) => link.fishSpecies.slug),
        technologySlugs: row.technologyLinks.map((link) => link.technology.slug),
        imageCount: row.images.length,
        hasHeroImage: row.images.some((image) => image.role === "HERO"),
      };
    }
    case "KNOWLEDGE_SOURCE": {
      const row = await prisma.knowledgeSource.findUnique({
        where: { id: entityId },
        select: { nameEn: true, baseUrl: true },
      });
      if (!row) return null;
      return { title: row.nameEn, url: row.baseUrl ?? undefined };
    }
    case "REGION": {
      const row = await prisma.region.findUnique({
        where: { id: entityId },
        select: { nameEn: true, nameTr: true, code: true },
      });
      if (!row) return null;
      return { nameEn: row.nameEn, nameTr: row.nameTr, code: row.code };
    }
    case "CATCH_REPORT": {
      const row = await prisma.catchReport.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          fishSpeciesId: true,
          lureVariantId: true,
          techniqueId: true,
          country: true,
          region: true,
        },
      });
      return row;
    }
    case "LURE_VARIANT": {
      const row = await prisma.lureVariant.findUnique({
        where: { id: entityId },
        select: { labelEn: true, labelTr: true, lureModelId: true },
      });
      return row;
    }
    case "PRODUCT_LINE": {
      const row = await prisma.productLine.findUnique({
        where: { id: entityId },
        select: { nameEn: true, nameTr: true, manufacturerId: true },
      });
      return row;
    }
    default:
      return null;
  }
}
