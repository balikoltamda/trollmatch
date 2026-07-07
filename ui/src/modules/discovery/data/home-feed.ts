import { prisma } from "@/lib/prisma";
import type { AppLocale } from "@/i18n/routing";
import {
  HOME_LURES,
  HOME_MANUFACTURERS,
  HOME_STATISTICS,
} from "@/modules/home/data/home-content";
import { listPublicLures } from "@/modules/discovery/data/browse-lures";
import {
  countPublicSpeciesWithLures,
  listPublicSpecies,
} from "@/modules/discovery/data/species";
import { PUBLIC_LURE_WHERE } from "@/modules/discovery/lib/public-visibility";
import type { HomeDiscoveryData } from "@/modules/discovery/types";

function emptyHomeData(): HomeDiscoveryData {
  return {
    species: [],
    latestLures: [],
    manufacturers: [],
    stats: {
      lureCount: 0,
      speciesCount: 0,
      manufacturerCount: 0,
      importBatchCount: 0,
    },
    fromDatabase: false,
  };
}

function fallbackHomeData(): HomeDiscoveryData {
  return {
    species: [],
    latestLures: HOME_LURES.map((l) => ({
      slug: l.slug,
      manufacturer: l.manufacturer,
      modelName: l.modelName,
      formFactor: l.formFactor,
      imageSrc: l.imageSrc,
      verified: l.verified,
    })),
    manufacturers: HOME_MANUFACTURERS.map((m) => ({
      slug: m.id === "yozuri" ? "yo-zuri" : m.id,
      name: m.name,
      countryCode: m.country,
      productCount: m.productCount,
    })),
    stats: {
      lureCount: Number(HOME_STATISTICS.find((s) => s.id === "lures")?.value.replace(/\D/g, "") ?? 0),
      speciesCount: 0,
      manufacturerCount: Number(HOME_STATISTICS.find((s) => s.id === "manufacturers")?.value.replace(/\D/g, "") ?? 0),
      importBatchCount: 0,
    },
    fromDatabase: false,
  };
}

async function listHomeManufacturers(limit = 6): Promise<HomeDiscoveryData["manufacturers"]> {
  const rows = await prisma.manufacturer.findMany({
    where: { deletedAt: null },
    select: {
      slug: true,
      nameEn: true,
      countryCode: true,
      _count: {
        select: {
          lureModels: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { nameEn: "asc" },
    take: limit,
  });

  return rows
    .map((row) => ({
      slug: row.slug,
      name: row.nameEn,
      countryCode: row.countryCode,
      productCount: row._count.lureModels,
    }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, limit);
}

export async function getHomeDiscoveryData(
  locale: AppLocale,
): Promise<HomeDiscoveryData> {
  try {
    const [species, lureList, lureCount, manufacturerCount, speciesWithLures, manufacturers, importBatchCount] =
      await Promise.all([
        listPublicSpecies(locale, 8),
        listPublicLures({ page: 1, pageSize: 4 }),
        prisma.lureModel.count({ where: PUBLIC_LURE_WHERE }),
        prisma.manufacturer.count({ where: { deletedAt: null } }),
        countPublicSpeciesWithLures(),
        listHomeManufacturers(6),
        prisma.importBatch.count(),
      ]);

    if (lureList.total === 0 && species.length === 0) {
      return fallbackHomeData();
    }

    const featuredSpecies =
      species.filter((s) => s.lureCount > 0).slice(0, 4).length > 0
        ? species.filter((s) => s.lureCount > 0).slice(0, 4)
        : species.slice(0, 4);

    return {
      species: featuredSpecies,
      latestLures: lureList.rows,
      manufacturers:
        manufacturers.length > 0
          ? manufacturers
          : fallbackHomeData().manufacturers,
      stats: {
        lureCount,
        speciesCount: speciesWithLures,
        manufacturerCount,
        importBatchCount,
      },
      fromDatabase: true,
    };
  } catch {
    return emptyHomeData();
  }
}

/** Collection cards on homepage → species or search entry points. */
export const COLLECTION_LINKS: Record<string, string> = {
  "bosphorus-bluefish": "/species",
  "aegean-shore": "/species",
  "med-topwater-trolling": "/species",
};
