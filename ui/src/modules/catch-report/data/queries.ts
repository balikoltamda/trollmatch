import { prisma } from "@/lib/prisma";
import { PUBLIC_LURE_WHERE } from "@/modules/discovery/lib/public-visibility";
import type {
  CatchReportFormContext,
  SpeciesTopLureFromReports,
} from "@/modules/catch-report/types";

const PLACEHOLDER_IMAGE = "/lures/placeholder.svg";

export async function getCatchReportFormContext(
  lureSlug: string,
): Promise<CatchReportFormContext | null> {
  try {
    const model = await prisma.lureModel.findFirst({
      where: { slug: lureSlug, ...PUBLIC_LURE_WHERE },
      select: {
        id: true,
        slug: true,
        variants: {
          where: { deletedAt: null },
          orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
          select: { id: true, slug: true, labelEn: true, labelTr: true },
        },
        lureSpeciesLinks: {
          where: { deletedAt: null },
          select: {
            fishSpecies: {
              select: { id: true, slug: true, nameEn: true, nameTr: true },
            },
          },
        },
        lureTechniques: {
          where: { deletedAt: null },
          select: {
            technique: {
              select: { id: true, slug: true, nameEn: true, nameTr: true },
            },
          },
        },
      },
    });

    if (!model || model.variants.length === 0) {
      return null;
    }

    return {
      lureModelId: model.id,
      lureSlug: model.slug,
      species: model.lureSpeciesLinks.map((link) => ({
        id: link.fishSpecies.id,
        slug: link.fishSpecies.slug,
        name: { en: link.fishSpecies.nameEn, tr: link.fishSpecies.nameTr },
      })),
      variants: model.variants.map((v) => ({
        id: v.id,
        slug: v.slug,
        label: { en: v.labelEn, tr: v.labelTr },
      })),
      techniques: model.lureTechniques.map((link) => ({
        id: link.technique.id,
        slug: link.technique.slug,
        name: { en: link.technique.nameEn, tr: link.technique.nameTr },
      })),
    };
  } catch {
    return null;
  }
}

export async function getTopLuresForSpeciesFromReports(
  speciesSlug: string,
  limit = 8,
): Promise<SpeciesTopLureFromReports[]> {
  try {
    const species = await prisma.fishSpecies.findFirst({
      where: { slug: speciesSlug, deletedAt: null },
      select: { id: true },
    });

    if (!species) {
      return [];
    }

    const groups = await prisma.catchReport.groupBy({
      by: ["lureVariantId"],
      where: {
        fishSpeciesId: species.id,
        verificationStatus: "APPROVED",
        mergedIntoId: null,
      },
      _count: { _all: true },
      _sum: { catchCount: true },
      orderBy: { _count: { lureVariantId: "desc" } },
      take: limit * 2,
    });

    if (groups.length === 0) {
      return [];
    }

    const variantIds = groups.map((g) => g.lureVariantId);
    const variants = await prisma.lureVariant.findMany({
      where: {
        id: { in: variantIds },
        deletedAt: null,
        lureModel: PUBLIC_LURE_WHERE,
      },
      select: {
        id: true,
        lureModel: {
          select: {
            slug: true,
            nameEn: true,
            nameTr: true,
            bodyTypeEn: true,
            bodyTypeTr: true,
            manufacturer: { select: { nameEn: true, nameTr: true } },
            images: {
              where: { deletedAt: null },
              take: 1,
              orderBy: [{ role: "asc" }, { sortOrder: "asc" }],
              select: { url: true, role: true },
            },
          },
        },
      },
    });

    const variantById = new Map(variants.map((v) => [v.id, v]));

    const results: SpeciesTopLureFromReports[] = [];

    for (const group of groups) {
      const variant = variantById.get(group.lureVariantId);
      if (!variant) continue;

      const hero =
        variant.lureModel.images.find((img) => img.role === "HERO") ??
        variant.lureModel.images[0];

      results.push({
        slug: variant.lureModel.slug,
        manufacturer: {
          en: variant.lureModel.manufacturer.nameEn,
          tr: variant.lureModel.manufacturer.nameTr,
        },
        modelName: {
          en: variant.lureModel.nameEn,
          tr: variant.lureModel.nameTr,
        },
        formFactor: {
          en: variant.lureModel.bodyTypeEn ?? "",
          tr: variant.lureModel.bodyTypeTr ?? variant.lureModel.bodyTypeEn ?? "",
        },
        imageSrc: hero?.url ?? PLACEHOLDER_IMAGE,
        reportCount: group._count._all,
        totalCatches: group._sum.catchCount ?? 0,
      });

      if (results.length >= limit) break;
    }

    return results.sort(
      (a, b) =>
        b.reportCount - a.reportCount || b.totalCatches - a.totalCatches,
    );
  } catch {
    return [];
  }
}

export async function listSpeciesForCatchForm(): Promise<
  Array<{ id: string; slug: string; nameEn: string; nameTr: string }>
> {
  try {
    return await prisma.fishSpecies.findMany({
      where: { deletedAt: null },
      orderBy: { nameEn: "asc" },
      select: { id: true, slug: true, nameEn: true, nameTr: true },
    });
  } catch {
    return [];
  }
}
