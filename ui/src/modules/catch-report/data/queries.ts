import { prisma } from "@/lib/prisma";
import {
  isPubliclyVisibleLifecycle,
  PUBLIC_LURE_WHERE,
} from "@/modules/discovery/lib/public-visibility";
import type {
  CatchReportFormContext,
  SpeciesTechniqueLureGroup,
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

    let techniques = model.lureTechniques.map((link) => ({
      id: link.technique.id,
      slug: link.technique.slug,
      name: { en: link.technique.nameEn, tr: link.technique.nameTr },
    }));

    if (techniques.length === 0) {
      const allTechniques = await prisma.technique.findMany({
        where: { deletedAt: null },
        orderBy: { nameEn: "asc" },
        select: { id: true, slug: true, nameEn: true, nameTr: true },
      });
      techniques = allTechniques.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: { en: t.nameEn, tr: t.nameTr },
      }));
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
      techniques,
    };
  } catch {
    return null;
  }
}

export async function getTopLuresByTechniqueForSpeciesFromReports(
  speciesSlug: string,
  limitPerTechnique = 4,
): Promise<SpeciesTechniqueLureGroup[]> {
  try {
    const species = await prisma.fishSpecies.findFirst({
      where: { slug: speciesSlug, deletedAt: null },
      select: { id: true },
    });

    if (!species) {
      return [];
    }

    const reports = await prisma.catchReport.findMany({
      where: {
        fishSpeciesId: species.id,
        verificationStatus: "APPROVED",
        mergedIntoId: null,
        techniqueId: { not: null },
      },
      select: {
        lureVariantId: true,
        catchCount: true,
        technique: {
          select: { id: true, slug: true, nameEn: true, nameTr: true },
        },
        lureVariant: {
          select: {
            id: true,
            deletedAt: true,
            lureModel: {
              select: {
                slug: true,
                nameEn: true,
                nameTr: true,
                bodyTypeEn: true,
                bodyTypeTr: true,
                deletedAt: true,
                lifecycleState: true,
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
        },
      },
    });

    type BucketKey = string;
    const buckets = new Map<
      BucketKey,
      {
        technique: { slug: string; name: { en: string; tr: string } };
        lureVariantId: string;
        reportCount: number;
        totalCatches: number;
        lure: SpeciesTopLureFromReports | null;
      }
    >();

    for (const report of reports) {
      if (!report.technique || !report.lureVariant?.lureModel) continue;
      const model = report.lureVariant.lureModel;
      if (model.deletedAt || !isPubliclyVisibleLifecycle(model.lifecycleState)) {
        continue;
      }

      const key = `${report.technique.id}:${report.lureVariantId}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.reportCount += 1;
        existing.totalCatches += report.catchCount;
        continue;
      }

      const hero =
        model.images.find((img) => img.role === "HERO") ?? model.images[0];

      buckets.set(key, {
        technique: {
          slug: report.technique.slug,
          name: { en: report.technique.nameEn, tr: report.technique.nameTr },
        },
        lureVariantId: report.lureVariantId,
        reportCount: 1,
        totalCatches: report.catchCount,
        lure: {
          slug: model.slug,
          manufacturer: {
            en: model.manufacturer.nameEn,
            tr: model.manufacturer.nameTr,
          },
          modelName: { en: model.nameEn, tr: model.nameTr },
          formFactor: {
            en: model.bodyTypeEn ?? "",
            tr: model.bodyTypeTr ?? model.bodyTypeEn ?? "",
          },
          imageSrc: hero?.url ?? PLACEHOLDER_IMAGE,
          reportCount: 1,
          totalCatches: report.catchCount,
        },
      });
    }

    const byTechnique = new Map<string, SpeciesTechniqueLureGroup>();

    for (const bucket of buckets.values()) {
      if (!bucket.lure) continue;

      const lureEntry: SpeciesTopLureFromReports = {
        ...bucket.lure,
        reportCount: bucket.reportCount,
        totalCatches: bucket.totalCatches,
      };

      const group = byTechnique.get(bucket.technique.slug);
      if (group) {
        group.lures.push(lureEntry);
      } else {
        byTechnique.set(bucket.technique.slug, {
          technique: bucket.technique,
          lures: [lureEntry],
        });
      }
    }

    return [...byTechnique.values()]
      .map((group) => ({
        ...group,
        lures: group.lures
          .sort(
            (a, b) =>
              b.reportCount - a.reportCount || b.totalCatches - a.totalCatches,
          )
          .slice(0, limitPerTechnique),
      }))
      .filter((group) => group.lures.length > 0)
      .sort(
        (a, b) =>
          b.lures.reduce((sum, lure) => sum + lure.reportCount, 0) -
          a.lures.reduce((sum, lure) => sum + lure.reportCount, 0),
      );
  } catch {
    return [];
  }
}

/** @deprecated Use getTopLuresByTechniqueForSpeciesFromReports */
export async function getTopLuresForSpeciesFromReports(
  speciesSlug: string,
  limit = 8,
): Promise<SpeciesTopLureFromReports[]> {
  const groups = await getTopLuresByTechniqueForSpeciesFromReports(
    speciesSlug,
    limit,
  );
  return groups.flatMap((group) => group.lures).slice(0, limit);
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
