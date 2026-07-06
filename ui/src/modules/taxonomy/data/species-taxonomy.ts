import { prisma } from "@/lib/prisma";
import type { SpeciesTaxonomyProfile } from "@/modules/taxonomy/types";

const TAXONOMY_INCLUDE = {
  aliases: {
    where: { deletedAt: null },
    orderBy: { alias: "asc" as const },
  },
  commonNames: {
    where: { deletedAt: null },
    orderBy: { name: "asc" as const },
  },
  confusions: {
    include: {
      confusedWithSpecies: {
        select: {
          slug: true,
          nameEn: true,
          nameTr: true,
          scientificName: true,
        },
      },
    },
  },
} as const;

export async function getSpeciesTaxonomyProfile(
  slug: string,
): Promise<SpeciesTaxonomyProfile | null> {
  try {
    const species = await prisma.fishSpecies.findFirst({
      where: { slug, deletedAt: null },
      include: TAXONOMY_INCLUDE,
    });

    if (!species) return null;

    return {
      slug: species.slug,
      scientificName: species.scientificName,
      preferredName: { en: species.nameEn, tr: species.nameTr },
      aliases: species.aliases.map((a) => ({
        alias: a.alias,
        kind: a.kind,
        locale: a.locale,
        countryScope: a.countryScope,
      })),
      regionalNames: species.commonNames.map((n) => ({
        name: n.name,
        locale: n.locale,
        countryScope: n.countryScope,
      })),
      confusions: species.confusions.map((c) => ({
        confusedWithSlug: c.confusedWithSpecies.slug,
        confusedWithName: {
          en: c.confusedWithSpecies.nameEn,
          tr: c.confusedWithSpecies.nameTr,
        },
        confusedWithScientific: c.confusedWithSpecies.scientificName,
        misappliedName: {
          en: c.misappliedNameEn,
          tr: c.misappliedNameTr,
        },
        reason: { en: c.reasonEn, tr: c.reasonTr },
        countryScope: c.countryScope,
      })),
      editorialNotes: {
        en: species.editorialNotesEn,
        tr: species.editorialNotesTr,
      },
    };
  } catch {
    return null;
  }
}
