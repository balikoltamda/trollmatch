import { prisma } from "@/lib/prisma";
import {
  HOME_LURES,
  HOME_SPECIES,
  HOME_STATISTICS,
} from "@/modules/home/data/home-content";
import { listPublicLures } from "@/modules/discovery/data/browse-lures";
import {
  countPublicSpeciesWithLures,
  listPublicSpecies,
} from "@/modules/discovery/data/species";
import { PUBLIC_LURE_WHERE } from "@/modules/discovery/lib/public-visibility";
import type { HomeDiscoveryData } from "@/modules/discovery/types";

function fallbackHomeData(): HomeDiscoveryData {
  return {
    species: HOME_SPECIES.map((s) => ({
      slug: s.id,
      name: s.name,
      subtitle: s.habitat,
      lureCount: s.lureCount,
    })),
    latestLures: HOME_LURES.map((l) => ({
      slug: l.slug,
      manufacturer: l.manufacturer,
      modelName: l.modelName,
      formFactor: l.formFactor,
      imageSrc: l.imageSrc,
      verified: l.verified,
    })),
    stats: {
      lureCount: Number(HOME_STATISTICS.find((s) => s.id === "lures")?.value.replace(/\D/g, "") ?? 0),
      speciesCount: Number(HOME_STATISTICS.find((s) => s.id === "species")?.value.replace(/\D/g, "") ?? 0),
      manufacturerCount: Number(HOME_STATISTICS.find((s) => s.id === "manufacturers")?.value.replace(/\D/g, "") ?? 0),
    },
    fromDatabase: false,
  };
}

export async function getHomeDiscoveryData(): Promise<HomeDiscoveryData> {
  try {
    const [species, lureList, lureCount, manufacturerCount, speciesWithLures] =
      await Promise.all([
        listPublicSpecies(8),
        listPublicLures({ page: 1, pageSize: 4 }),
        prisma.lureModel.count({ where: PUBLIC_LURE_WHERE }),
        prisma.manufacturer.count({ where: { deletedAt: null } }),
        countPublicSpeciesWithLures(),
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
      stats: {
        lureCount,
        speciesCount: speciesWithLures,
        manufacturerCount,
      },
      fromDatabase: true,
    };
  } catch {
    return fallbackHomeData();
  }
}

/** Collection cards on homepage → species or search entry points. */
export const COLLECTION_LINKS: Record<string, string> = {
  "bosphorus-bluefish": "/species/bluefish",
  "aegean-shore": "/species/european-seabass",
  "med-topwater-trolling": "/species/bonito",
};
