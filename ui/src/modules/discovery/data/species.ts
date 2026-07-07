import type { DataFetchResult } from "@/lib/data-result";
import { logServerError } from "@/lib/log-server-error";
import { prisma } from "@/lib/prisma";
import type { AppLocale } from "@/i18n/routing";
import { PUBLIC_LURE_WHERE } from "@/modules/discovery/lib/public-visibility";
import { listPublicLures } from "@/modules/discovery/data/browse-lures";
import { getTopLuresByTechniqueForSpeciesFromReports } from "@/modules/catch-report/data/queries";
import {
  getSpeciesHeroImageUrlsBySpeciesIds,
} from "@/modules/species/data/species-compass";
import {
  PUBLIC_SPECIES_LIST_WHERE,
} from "@/modules/species/repositories/species-repository";
import { speciesLocaleSlug, speciesPublicSlugWhere } from "@/modules/species/lib/slug";
import { PUBLIC_SPECIES_PROFILE_WHERE } from "@/modules/species/lib/public-visibility";
import type { SpeciesCardData, SpeciesDetailData } from "@/modules/discovery/types";

async function publishedLureCountsBySpecies(): Promise<Map<string, number>> {
  const groups = await prisma.lureSpecies.groupBy({
    by: ["fishSpeciesId"],
    where: {
      deletedAt: null,
      lureModel: PUBLIC_LURE_WHERE,
    },
    _count: { _all: true },
  });

  return new Map(groups.map((g) => [g.fishSpeciesId, g._count._all]));
}

export async function listPublicSpecies(
  locale: AppLocale,
  limit = 100,
): Promise<SpeciesCardData[]> {
  try {
    const [species, counts] = await Promise.all([
      prisma.fishSpecies.findMany({
        where: PUBLIC_SPECIES_LIST_WHERE,
        orderBy: { nameEn: "asc" },
        take: limit,
        select: {
          id: true,
          slugEn: true,
          slugTr: true,
          slug: true,
          nameEn: true,
          nameTr: true,
          scientificName: true,
          profile: {
            where: PUBLIC_SPECIES_PROFILE_WHERE,
            select: { habitatEn: true, habitatTr: true },
          },
          regionLinks: {
            include: {
              region: {
                select: { code: true, nameEn: true, nameTr: true },
              },
            },
          },
        },
      }),
      publishedLureCountsBySpecies(),
    ]);

    const heroImages = await getSpeciesHeroImageUrlsBySpeciesIds(
      species.map((row) => row.id),
    );

    return species
      .map((row) => {
        const regions = row.regionLinks
          .map((link) => ({
            en: link.region.nameEn,
            tr: link.region.nameTr,
            code: link.region.code,
          }))
          .sort((a, b) => a.en.localeCompare(b.en));

        return {
          slug: speciesLocaleSlug(row, locale),
          slugEn: row.slugEn,
          slugTr: row.slugTr,
          name: { en: row.nameEn, tr: row.nameTr },
          scientificName: row.scientificName,
          regions,
          lureCount: counts.get(row.id) ?? 0,
          heroImageUrl: heroImages.get(row.id) ?? null,
        };
      })
      .sort((a, b) => b.lureCount - a.lureCount || a.name.en.localeCompare(b.name.en));
  } catch (error) {
    await logServerError({
      page: "/[locale]/species",
      operation: "listPublicSpecies",
      error,
    });
    return [];
  }
}

export async function getSpeciesDetailResult(
  slug: string,
  locale: AppLocale,
): Promise<DataFetchResult<SpeciesDetailData>> {
  try {
    const species = await prisma.fishSpecies.findFirst({
      where: speciesPublicSlugWhere(slug, locale),
      select: {
        id: true,
        slug: true,
        slugEn: true,
        slugTr: true,
        nameEn: true,
        nameTr: true,
        scientificName: true,
        profile: {
          where: PUBLIC_SPECIES_PROFILE_WHERE,
          select: {
            habitatEn: true,
            habitatTr: true,
            maxLengthCm: true,
            maxWeightG: true,
            descriptionEn: true,
            descriptionTr: true,
            lifecycleState: true,
          },
        },
        regionLinks: {
          include: {
            region: {
              select: { code: true, nameEn: true, nameTr: true },
            },
          },
        },
      },
    });

    if (!species || !species.profile) {
      return { status: "not_found" };
    }

    const canonicalSlug = speciesLocaleSlug(species, locale);
    const regions = species.regionLinks
      .map((link) => ({
        en: link.region.nameEn,
        tr: link.region.nameTr,
        code: link.region.code,
      }))
      .sort((a, b) => a.en.localeCompare(b.en));

    const [lureList, topLuresByTechnique] = await Promise.all([
      listPublicLures({ species: species.slugEn, page: 1, pageSize: 48 }),
      getTopLuresByTechniqueForSpeciesFromReports(species.slugEn, 4),
    ]);

    return {
      status: "ok",
      data: {
        slug: canonicalSlug,
        slugEn: species.slugEn,
        slugTr: species.slugTr,
        name: { en: species.nameEn, tr: species.nameTr },
        scientificName: species.scientificName,
        habitat: {
          en: species.profile.habitatEn?.trim() || "",
          tr: species.profile.habitatTr?.trim() || "",
        },
        maxLengthCm: species.profile.maxLengthCm
          ? Number(species.profile.maxLengthCm)
          : null,
        maxWeightG: species.profile.maxWeightG
          ? Number(species.profile.maxWeightG)
          : null,
        description: {
          en: species.profile.descriptionEn?.trim() || "",
          tr: species.profile.descriptionTr?.trim() || "",
        },
        regions,
        lureCount: lureList.total,
        lures: lureList.rows,
        topLuresByTechnique,
      },
    };
  } catch (error) {
    await logServerError({
      page: "/[locale]/species/[slug]",
      slug,
      operation: "getSpeciesDetail",
      error,
    });
    return { status: "unavailable" };
  }
}

/** @deprecated Use getSpeciesDetailResult — returns null for both not_found and errors. */
export async function getSpeciesDetail(
  slug: string,
  locale: AppLocale,
): Promise<SpeciesDetailData | null> {
  const result = await getSpeciesDetailResult(slug, locale);
  return result.status === "ok" ? result.data : null;
}

export async function countPublicSpeciesWithLures(): Promise<number> {
  try {
    const counts = await publishedLureCountsBySpecies();
    const publicSpecies = await prisma.fishSpecies.count({
      where: PUBLIC_SPECIES_LIST_WHERE,
    });
    return Math.min(publicSpecies, [...counts.values()].filter((n) => n > 0).length);
  } catch {
    return 0;
  }
}
