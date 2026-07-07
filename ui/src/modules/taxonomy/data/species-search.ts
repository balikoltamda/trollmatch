import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/log-server-error";
import { normalizeSpeciesLabel } from "@/modules/taxonomy/lib/normalize-species-label";
import { PUBLIC_SPECIES_LIST_WHERE } from "@/modules/species/repositories/species-repository";
import type {
  SpeciesSearchHit,
  SpeciesSearchResult,
} from "@/modules/taxonomy/types";

type SpeciesRow = {
  slug: string;
  slugEn: string;
  slugTr: string;
  scientificName: string;
  nameEn: string;
  nameTr: string;
  aliases: Array<{ alias: string; kind: string }>;
  commonNames: Array<{ name: string }>;
};

function buildDirectHit(
  species: SpeciesRow,
  matchKind: SpeciesSearchHit["matchKind"],
): SpeciesSearchHit {
  return {
    slug: species.slugEn,
    slugEn: species.slugEn,
    slugTr: species.slugTr,
    scientificName: species.scientificName,
    preferredName: { en: species.nameEn, tr: species.nameTr },
    matchKind,
    disambiguation: null,
  };
}

function matchesNormalized(text: string, normalized: string): boolean {
  return normalizeSpeciesLabel(text).includes(normalized);
}

export async function searchSpeciesByTaxonomy(
  query: string,
): Promise<SpeciesSearchResult> {
  const q = query.trim();
  if (!q) {
    return { query: "", hits: [] };
  }

  const normalized = normalizeSpeciesLabel(q);

  try {
    const speciesList = await prisma.fishSpecies.findMany({
      where: PUBLIC_SPECIES_LIST_WHERE,
      include: {
        aliases: { where: { deletedAt: null } },
        commonNames: { where: { deletedAt: null } },
      },
    });

    const hits: SpeciesSearchHit[] = [];
    const seen = new Set<string>();

    for (const species of speciesList) {
      let matchKind: SpeciesSearchHit["matchKind"] | null = null;

      if (matchesNormalized(species.scientificName, normalized)) {
        matchKind = "scientific";
      } else if (
        matchesNormalized(species.nameEn, normalized) ||
        matchesNormalized(species.nameTr, normalized)
      ) {
        matchKind = "preferred";
      } else if (
        species.aliases.some((a) => matchesNormalized(a.alias, normalized))
      ) {
        matchKind = "alias";
      } else if (
        species.commonNames.some((n) => matchesNormalized(n.name, normalized))
      ) {
        matchKind = "regional";
      }

      if (matchKind && !seen.has(species.slugEn)) {
        seen.add(species.slugEn);
        hits.push(buildDirectHit(species, matchKind));
      }
    }

    const confusions = await prisma.speciesConfusion.findMany({
      where: {
        fishSpecies: PUBLIC_SPECIES_LIST_WHERE,
        confusedWithSpecies: PUBLIC_SPECIES_LIST_WHERE,
      },
      include: {
        fishSpecies: {
          select: {
            slugEn: true,
            slugTr: true,
            slug: true,
            nameEn: true,
            nameTr: true,
            scientificName: true,
          },
        },
        confusedWithSpecies: {
          select: {
            slugEn: true,
            slugTr: true,
            slug: true,
            nameEn: true,
            nameTr: true,
            scientificName: true,
          },
        },
      },
    });

    for (const confusion of confusions) {
      const misappliedEn = confusion.misappliedNameEn ?? "";
      const misappliedTr = confusion.misappliedNameTr ?? "";
      const matchesMisapplied =
        (misappliedEn && matchesNormalized(misappliedEn, normalized)) ||
        (misappliedTr && matchesNormalized(misappliedTr, normalized));

      if (!matchesMisapplied) continue;

      const target = confusion.confusedWithSpecies;
      if (seen.has(target.slugEn)) continue;

      seen.add(target.slugEn);
      hits.push({
        slug: target.slugEn,
        slugEn: target.slugEn,
        slugTr: target.slugTr,
        scientificName: target.scientificName,
        preferredName: { en: target.nameEn, tr: target.nameTr },
        matchKind: "confusion_misapplied",
        disambiguation: {
          primarySlug: confusion.fishSpecies.slugEn,
          primaryName: {
            en: confusion.fishSpecies.nameEn,
            tr: confusion.fishSpecies.nameTr,
          },
          reason: { en: confusion.reasonEn, tr: confusion.reasonTr },
        },
      });
    }

    const kindOrder: Record<SpeciesSearchHit["matchKind"], number> = {
      scientific: 0,
      preferred: 1,
      alias: 2,
      regional: 3,
      confusion_misapplied: 4,
    };

    hits.sort(
      (a, b) =>
        kindOrder[a.matchKind] - kindOrder[b.matchKind] ||
        a.preferredName.en.localeCompare(b.preferredName.en),
    );

    return { query: q, hits };
  } catch (error) {
    await logServerError({
      page: "/[locale]/search",
      operation: "searchSpeciesByTaxonomy",
      error,
    });
    return { query: q, hits: [] };
  }
}
