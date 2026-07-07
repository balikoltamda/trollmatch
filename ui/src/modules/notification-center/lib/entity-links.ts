import type { StudioReviewEntityType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  STUDIO_REGIONS_PATH,
  STUDIO_SPECIES_PATH,
} from "@/modules/studio/lib/studio-routes";

/** Resolve a Studio editor href for an entity — used by notification Open actions. */
export async function resolveEntityHref(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<string | null> {
  switch (entityType) {
    case "SPECIES": {
      const row = await prisma.fishSpecies.findUnique({
        where: { id: entityId },
        select: { slugEn: true },
      });
      return row ? `${STUDIO_SPECIES_PATH}/${row.slugEn}` : null;
    }
    case "LURE":
      return `/studio/products/${entityId}`;
    case "MANUFACTURER": {
      const row = await prisma.manufacturer.findUnique({
        where: { id: entityId },
        select: { slug: true },
      });
      return row ? `/studio/manufacturers/${row.slug}` : null;
    }
    case "REGION": {
      const row = await prisma.region.findUnique({
        where: { id: entityId },
        select: { slug: true },
      });
      return row ? `${STUDIO_REGIONS_PATH}/${row.slug}` : null;
    }
    case "TECHNIQUE":
      return "/studio/techniques";
    case "KNOWLEDGE_SOURCE":
      return "/studio/source-archive";
    case "CATCH_REPORT":
      return "/studio/community/reports";
    case "LURE_VARIANT":
    case "PRODUCT_LINE":
      return "/studio/intelligence";
    default:
      return null;
  }
}

/** Resolve URL slug used in notification fingerprints. */
export async function resolveEntitySlug(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<string> {
  switch (entityType) {
    case "SPECIES": {
      const r = await prisma.fishSpecies.findUnique({ where: { id: entityId }, select: { slugEn: true } });
      return r?.slugEn ?? entityId.slice(0, 8);
    }
    case "LURE": {
      const r = await prisma.lureModel.findUnique({ where: { id: entityId }, select: { slug: true } });
      return r?.slug ?? entityId.slice(0, 8);
    }
    case "MANUFACTURER": {
      const r = await prisma.manufacturer.findUnique({ where: { id: entityId }, select: { slug: true } });
      return r?.slug ?? entityId.slice(0, 8);
    }
    case "REGION": {
      const r = await prisma.region.findUnique({ where: { id: entityId }, select: { slug: true } });
      return r?.slug ?? entityId.slice(0, 8);
    }
    case "TECHNIQUE": {
      const r = await prisma.technique.findUnique({ where: { id: entityId }, select: { slug: true } });
      return r?.slug ?? entityId.slice(0, 8);
    }
    case "KNOWLEDGE_SOURCE": {
      const r = await prisma.knowledgeSource.findUnique({ where: { id: entityId }, select: { slug: true } });
      return r?.slug ?? entityId.slice(0, 8);
    }
    case "LURE_VARIANT": {
      const r = await prisma.lureVariant.findUnique({
        where: { id: entityId },
        select: { labelEn: true, lureModel: { select: { slug: true } } },
      });
      return r ? `${r.lureModel.slug}-${r.labelEn}`.toLowerCase().replace(/\s+/g, "-") : entityId.slice(0, 8);
    }
    case "PRODUCT_LINE": {
      const r = await prisma.productLine.findUnique({ where: { id: entityId }, select: { slug: true } });
      return r?.slug ?? entityId.slice(0, 8);
    }
    default:
      return entityId.slice(0, 8);
  }
}

/** Display name for notifications (entityName). */
export async function resolveEntityName(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<string> {
  switch (entityType) {
    case "SPECIES": {
      const r = await prisma.fishSpecies.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "LURE": {
      const r = await prisma.lureModel.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "TECHNIQUE": {
      const r = await prisma.technique.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "MANUFACTURER": {
      const r = await prisma.manufacturer.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "REGION": {
      const r = await prisma.region.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "KNOWLEDGE_SOURCE": {
      const r = await prisma.knowledgeSource.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "CATCH_REPORT": {
      const r = await prisma.catchReport.findUnique({
        where: { id: entityId },
        select: { fishSpecies: { select: { nameEn: true } } },
      });
      return r?.fishSpecies.nameEn ?? entityId.slice(0, 8);
    }
    case "LURE_VARIANT": {
      const r = await prisma.lureVariant.findUnique({ where: { id: entityId }, select: { labelEn: true } });
      return r?.labelEn ?? entityId.slice(0, 8);
    }
    case "PRODUCT_LINE": {
      const r = await prisma.productLine.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    default:
      return entityId.slice(0, 8);
  }
}
