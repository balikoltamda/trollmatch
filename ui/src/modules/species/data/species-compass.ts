import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { AppLocale } from "@/i18n/routing";
import { listApprovedCatchReportsForSpecies } from "@/modules/catch-report/data/list-reports";
import {
  emptyCommunityStatistics,
  getCommunityStatisticsForSpecies,
  getCommunityTechniquesForSpecies,
} from "@/modules/catch-report/data/community-statistics";
import { PUBLIC_SPECIES_PROFILE_WHERE } from "@/modules/species/lib/public-visibility";
import { speciesPublicSlugWhere } from "@/modules/species/lib/slug";
import type {
  SpeciesClassificationView,
  SpeciesCompassData,
  SpeciesImageView,
  SpeciesProfileView,
  SpeciesRegionalNotesView,
  SpeciesTechniqueView,
} from "@/modules/species/types";
import type { LocalizedPair } from "@/modules/discovery/types";

function localizedPair(
  en: string | null | undefined,
  tr: string | null | undefined,
): LocalizedPair | null {
  if (!en?.trim() && !tr?.trim()) return null;
  return { en: en?.trim() ?? "", tr: tr?.trim() ?? "" };
}

function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapProfile(row: {
  descriptionEn: string | null;
  descriptionTr: string | null;
  habitatEn: string | null;
  habitatTr: string | null;
  distributionEn: string | null;
  distributionTr: string | null;
  depthMinM: unknown;
  depthMaxM: unknown;
  spawningEn: string | null;
  spawningTr: string | null;
  maxLengthCm: unknown;
  maxWeightG: unknown;
  conservationEn: string | null;
  conservationTr: string | null;
  faoAreas: string[];
  iucnStatus: SpeciesProfileView["iucnStatus"];
  lifecycleState: SpeciesProfileView["lifecycleState"];
}): SpeciesProfileView {
  return {
    description: localizedPair(row.descriptionEn, row.descriptionTr),
    habitat: localizedPair(row.habitatEn, row.habitatTr),
    distribution: localizedPair(row.distributionEn, row.distributionTr),
    depthMinM: decimalToNumber(row.depthMinM),
    depthMaxM: decimalToNumber(row.depthMaxM),
    spawning: localizedPair(row.spawningEn, row.spawningTr),
    maxLengthCm: decimalToNumber(row.maxLengthCm),
    maxWeightG: decimalToNumber(row.maxWeightG),
    conservation: localizedPair(row.conservationEn, row.conservationTr),
    faoAreas: row.faoAreas,
    iucnStatus: row.iucnStatus,
    lifecycleState: row.lifecycleState,
  };
}

function mapClassification(row: {
  kingdom: string | null;
  phylum: string | null;
  className: string | null;
  orderName: string | null;
  family: string | null;
  genus: string | null;
}): SpeciesClassificationView {
  return {
    kingdom: row.kingdom,
    phylum: row.phylum,
    className: row.className,
    orderName: row.orderName,
    family: row.family,
    genus: row.genus,
  };
}

function mapRegionalNotes(row: {
  mediterraneanNotesEn: string | null;
  mediterraneanNotesTr: string | null;
  aegeanNotesEn: string | null;
  aegeanNotesTr: string | null;
  northernCyprusNotesEn: string | null;
  northernCyprusNotesTr: string | null;
}): SpeciesRegionalNotesView {
  return {
    mediterranean: localizedPair(
      row.mediterraneanNotesEn,
      row.mediterraneanNotesTr,
    ),
    aegean: localizedPair(row.aegeanNotesEn, row.aegeanNotesTr),
    northernCyprus: localizedPair(
      row.northernCyprusNotesEn,
      row.northernCyprusNotesTr,
    ),
  };
}

function hasRegionalNotes(notes: SpeciesRegionalNotesView): boolean {
  return (
    notes.mediterranean !== null ||
    notes.aegean !== null ||
    notes.northernCyprus !== null
  );
}

function hasClassification(classification: SpeciesClassificationView): boolean {
  return Object.values(classification).some((value) => value?.trim());
}

const COMPASS_INCLUDE = {
  profile: { where: PUBLIC_SPECIES_PROFILE_WHERE },
  classification: true,
  editorNote: true,
  images: {
    where: { deletedAt: null },
    orderBy: [{ role: "asc" as const }, { sortOrder: "asc" as const }],
  },
  techniqueLinks: {
    where: { deletedAt: null, technique: { deletedAt: null } },
    include: {
      technique: {
        select: { slug: true, nameEn: true, nameTr: true },
      },
    },
    orderBy: { technique: { nameEn: "asc" as const } },
  },
} satisfies Prisma.FishSpeciesInclude;

export async function getSpeciesCompassData(
  slugOrSlugEn: string,
  locale: AppLocale = "en",
): Promise<SpeciesCompassData | null> {
  try {
    const species = await prisma.fishSpecies.findFirst({
      where: speciesPublicSlugWhere(slugOrSlugEn, locale),
      include: COMPASS_INCLUDE,
    });

    if (!species) return null;

    const profile = species.profile ? mapProfile(species.profile) : null;
    const classification = species.classification
      ? mapClassification(species.classification)
      : null;
    const regionalNotes = species.editorNote
      ? mapRegionalNotes(species.editorNote)
      : null;

    const images: SpeciesImageView[] = species.images.map((img) => ({
      url: img.url,
      alt: {
        en: img.altTextEn?.trim() || species.nameEn,
        tr: img.altTextTr?.trim() || species.nameTr,
      },
      role: img.role,
    }));

    const heroImageUrl =
      images.find((img) => img.role === "HERO")?.url ??
      images[0]?.url ??
      null;

    const gallery = images.filter((img) => img.role === "GALLERY");

    const techniques: SpeciesTechniqueView[] = species.techniqueLinks.map(
      (link) => ({
        slug: link.technique.slug,
        name: { en: link.technique.nameEn, tr: link.technique.nameTr },
      }),
    );

    const editorialSlugs = techniques.map((technique) => technique.slug);
    const communityTechniques = await getCommunityTechniquesForSpecies(
      species.id,
      editorialSlugs,
    );

    const mergedTechniques = [
      ...techniques,
      ...communityTechniques.filter(
        (technique) => !editorialSlugs.includes(technique.slug),
      ),
    ];

    const catchReports = await listApprovedCatchReportsForSpecies(species.slugEn, 8);
    const communityStatistics = await getCommunityStatisticsForSpecies(species.id);

    const empty =
      !profile &&
      (!classification || !hasClassification(classification)) &&
      (!regionalNotes || !hasRegionalNotes(regionalNotes)) &&
      !heroImageUrl &&
      gallery.length === 0 &&
      techniques.length === 0 &&
      mergedTechniques.length === 0 &&
      catchReports.length === 0 &&
      communityStatistics.verifiedCatchReportCount === 0;

    if (empty) {
      return {
        profile: null,
        classification: null,
        regionalNotes: null,
        heroImageUrl: null,
        gallery: [],
        techniques: [],
        catchReports: [],
        communityStatistics: emptyCommunityStatistics(),
      };
    }

    return {
      profile,
      classification:
        classification && hasClassification(classification)
          ? classification
          : null,
      regionalNotes:
        regionalNotes && hasRegionalNotes(regionalNotes) ? regionalNotes : null,
      heroImageUrl,
      gallery,
      techniques: mergedTechniques,
      catchReports,
      communityStatistics,
    };
  } catch {
    return null;
  }
}

export async function getSpeciesHeroImageUrl(
  slugOrSlugEn: string,
  locale: AppLocale = "en",
): Promise<string | null> {
  try {
    const hero = await prisma.speciesImage.findFirst({
      where: {
        deletedAt: null,
        role: "HERO",
        fishSpecies: speciesPublicSlugWhere(slugOrSlugEn, locale),
      },
      orderBy: { sortOrder: "asc" },
      select: { url: true },
    });
    if (hero) return hero.url;

    const fallback = await prisma.speciesImage.findFirst({
      where: {
        deletedAt: null,
        fishSpecies: speciesPublicSlugWhere(slugOrSlugEn, locale),
      },
      orderBy: { sortOrder: "asc" },
      select: { url: true },
    });
    return fallback?.url ?? null;
  } catch {
    return null;
  }
}

export async function getSpeciesHeroImageUrlsBySlugs(
  slugs: string[],
): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map();

  try {
    const rows = await prisma.speciesImage.findMany({
      where: {
        deletedAt: null,
        fishSpecies: {
          deletedAt: null,
          OR: [{ slugEn: { in: slugs } }, { slugTr: { in: slugs } }, { slug: { in: slugs } }],
        },
      },
      orderBy: [{ role: "asc" }, { sortOrder: "asc" }],
      select: {
        url: true,
        role: true,
        fishSpecies: { select: { slugEn: true, slugTr: true, slug: true } },
      },
    });

    const map = new Map<string, string>();
    for (const slug of slugs) {
      const hero = rows.find(
        (row) =>
          (row.fishSpecies.slugEn === slug ||
            row.fishSpecies.slugTr === slug ||
            row.fishSpecies.slug === slug) &&
          row.role === "HERO",
      );
      const first = rows.find(
        (row) =>
          row.fishSpecies.slugEn === slug ||
          row.fishSpecies.slugTr === slug ||
          row.fishSpecies.slug === slug,
      );
      const url = hero?.url ?? first?.url;
      if (url) map.set(slug, url);
    }
    return map;
  } catch {
    return new Map();
  }
}

export async function getSpeciesHeroImageUrlsBySpeciesIds(
  speciesIds: string[],
): Promise<Map<string, string>> {
  if (speciesIds.length === 0) return new Map();

  try {
    const rows = await prisma.speciesImage.findMany({
      where: {
        deletedAt: null,
        fishSpeciesId: { in: speciesIds },
      },
      orderBy: [{ role: "asc" }, { sortOrder: "asc" }],
      select: {
        url: true,
        role: true,
        fishSpeciesId: true,
      },
    });

    const map = new Map<string, string>();
    for (const id of speciesIds) {
      const hero = rows.find((row) => row.fishSpeciesId === id && row.role === "HERO");
      const first = rows.find((row) => row.fishSpeciesId === id);
      const url = hero?.url ?? first?.url;
      if (url) map.set(id, url);
    }
    return map;
  } catch {
    return new Map();
  }
}

export async function getSpeciesCardSubtitle(
  slugOrSlugEn: string,
  locale: AppLocale = "en",
): Promise<{ en: string; tr: string } | null> {
  try {
    const species = await prisma.fishSpecies.findFirst({
      where: speciesPublicSlugWhere(slugOrSlugEn, locale),
      select: {
        scientificName: true,
        profile: {
          where: PUBLIC_SPECIES_PROFILE_WHERE,
          select: { habitatEn: true, habitatTr: true },
        },
      },
    });
    if (!species) return null;

    const habitat = localizedPair(
      species.profile?.habitatEn,
      species.profile?.habitatTr,
    );
    if (habitat) return habitat;

    return { en: species.scientificName, tr: species.scientificName };
  } catch {
    return null;
  }
}
