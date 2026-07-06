import type { DataFetchResult } from "@/lib/data-result";
import { logServerError } from "@/lib/log-server-error";
import { prisma } from "@/lib/prisma";
import { PUBLIC_LURE_WHERE } from "@/modules/discovery/lib/public-visibility";
import { listPublicLures } from "@/modules/discovery/data/browse-lures";
import { getTopLuresForSpeciesFromReports } from "@/modules/catch-report/data/queries";
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

export async function listPublicSpecies(limit = 100): Promise<SpeciesCardData[]> {
  try {
    const [species, counts] = await Promise.all([
      prisma.fishSpecies.findMany({
        where: { deletedAt: null },
        orderBy: { nameEn: "asc" },
        take: limit,
        select: {
          slug: true,
          nameEn: true,
          nameTr: true,
          scientificName: true,
          id: true,
        },
      }),
      publishedLureCountsBySpecies(),
    ]);

    return species
      .map((row) => ({
        slug: row.slug,
        name: { en: row.nameEn, tr: row.nameTr },
        subtitle: { en: row.scientificName, tr: row.scientificName },
        lureCount: counts.get(row.id) ?? 0,
      }))
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
): Promise<DataFetchResult<SpeciesDetailData>> {
  try {
    const species = await prisma.fishSpecies.findFirst({
      where: { slug, deletedAt: null },
      select: {
        slug: true,
        nameEn: true,
        nameTr: true,
        scientificName: true,
      },
    });

    if (!species) {
      return { status: "not_found" };
    }

    const [lureList, topLuresFromReports] = await Promise.all([
      listPublicLures({ species: slug, page: 1, pageSize: 48 }),
      getTopLuresForSpeciesFromReports(slug, 8),
    ]);

    return {
      status: "ok",
      data: {
        slug: species.slug,
        name: { en: species.nameEn, tr: species.nameTr },
        scientificName: species.scientificName,
        lureCount: lureList.total,
        lures: lureList.rows,
        topLuresFromReports,
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
): Promise<SpeciesDetailData | null> {
  const result = await getSpeciesDetailResult(slug);
  return result.status === "ok" ? result.data : null;
}

export async function countPublicSpeciesWithLures(): Promise<number> {
  try {
    const counts = await publishedLureCountsBySpecies();
    return [...counts.values()].filter((n) => n > 0).length;
  } catch {
    return 0;
  }
}
