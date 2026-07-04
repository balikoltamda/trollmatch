import { prisma } from "@/lib/prisma";
import { PUBLIC_LURE_WHERE } from "@/modules/discovery/lib/public-visibility";
import { listLuresForSpecies } from "@/modules/discovery/data/browse-lures";
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
  } catch {
    return [];
  }
}

export async function getSpeciesDetail(
  slug: string,
): Promise<SpeciesDetailData | null> {
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
      return null;
    }

    const lures = await listLuresForSpecies(slug);

    return {
      slug: species.slug,
      name: { en: species.nameEn, tr: species.nameTr },
      scientificName: species.scientificName,
      lureCount: lures.length,
      lures,
    };
  } catch {
    return null;
  }
}

export async function countPublicSpeciesWithLures(): Promise<number> {
  try {
    const counts = await publishedLureCountsBySpecies();
    return [...counts.values()].filter((n) => n > 0).length;
  } catch {
    return 0;
  }
}
