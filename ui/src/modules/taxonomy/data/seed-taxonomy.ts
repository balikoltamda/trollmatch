import { prisma } from "@/lib/prisma";
import {
  getLexiconTermById,
  lexiconTermToSpeciesSeed,
  REFERENCE_SPECIES_LEXICON_IDS,
  type SpeciesSeedFromLexicon,
} from "@/modules/terminology";
import { normalizeSpeciesLabel } from "@/modules/taxonomy/lib/normalize-species-label";

const REFERENCE_SPECIES: SpeciesSeedFromLexicon[] =
  REFERENCE_SPECIES_LEXICON_IDS.map((id) => {
    const term = getLexiconTermById(id);
    if (!term) {
      throw new Error(`Missing lexicon entry for reference species: ${id}`);
    }
    return lexiconTermToSpeciesSeed(term);
  });

const CONFUSION_SEED = {
  primaryLexiconTermId: "lichia-amia",
  confusedLexiconTermId: "seriola-dumerili",
  misappliedNameTr: "Akya",
  reasonEn:
    "Some regions incorrectly use the name Akya for Seriola dumerili. Akya is the preferred Turkish name for Lichia amia.",
  reasonTr:
    "Bazı bölgelerde Akya adı yanlışlıkla Seriola dumerili için kullanılır. Akya, Lichia amia türünün tercih edilen Türkçe adıdır.",
  countryScope: "TR",
};

async function upsertSpecies(seed: SpeciesSeedFromLexicon) {
  const species = await prisma.fishSpecies.upsert({
    where: { slug: seed.slug },
    create: {
      slug: seed.slug,
      scientificName: seed.scientificName,
      nameEn: seed.nameEn,
      nameTr: seed.nameTr,
      editorialNotesEn: seed.editorialNotesEn,
      editorialNotesTr: seed.editorialNotesTr,
    },
    update: {
      scientificName: seed.scientificName,
      nameEn: seed.nameEn,
      nameTr: seed.nameTr,
      editorialNotesEn: seed.editorialNotesEn,
      editorialNotesTr: seed.editorialNotesTr,
      deletedAt: null,
    },
  });

  await prisma.speciesScientificName.upsert({
    where: { fishSpeciesId: species.id },
    create: {
      fishSpeciesId: species.id,
      name: seed.scientificName,
      nameNormalized: normalizeSpeciesLabel(seed.scientificName),
    },
    update: {
      name: seed.scientificName,
      nameNormalized: normalizeSpeciesLabel(seed.scientificName),
    },
  });

  for (const alias of seed.aliases) {
    const aliasNormalized = normalizeSpeciesLabel(alias.alias);
    const locale = alias.locale ?? "any";
    const countryScope = alias.countryScope ?? "global";

    await prisma.speciesAlias.upsert({
      where: {
        aliasNormalized_locale_countryScope: {
          aliasNormalized,
          locale,
          countryScope,
        },
      },
      create: {
        fishSpeciesId: species.id,
        alias: alias.alias,
        aliasNormalized,
        kind: alias.kind,
        locale,
        countryScope,
      },
      update: {
        fishSpeciesId: species.id,
        kind: alias.kind,
        deletedAt: null,
      },
    });
  }

  for (const regional of seed.regionalNames) {
    const nameNormalized = normalizeSpeciesLabel(regional.name);

    await prisma.speciesCommonName.upsert({
      where: {
        fishSpeciesId_locale_countryScope_nameNormalized: {
          fishSpeciesId: species.id,
          locale: regional.locale,
          countryScope: regional.countryScope,
          nameNormalized,
        },
      },
      create: {
        fishSpeciesId: species.id,
        locale: regional.locale,
        countryScope: regional.countryScope,
        name: regional.name,
        nameNormalized,
      },
      update: {
        name: regional.name,
        deletedAt: null,
      },
    });
  }

  return species;
}

export async function ensureTaxonomyReferenceSeeds(): Promise<void> {
  try {
    const speciesByLexiconId = new Map<string, string>();

    for (const seed of REFERENCE_SPECIES) {
      const species = await upsertSpecies(seed);
      speciesByLexiconId.set(seed.lexiconTermId, species.id);
    }

    const primaryId = speciesByLexiconId.get(CONFUSION_SEED.primaryLexiconTermId);
    const confusedId = speciesByLexiconId.get(
      CONFUSION_SEED.confusedLexiconTermId,
    );

    if (primaryId && confusedId) {
      await prisma.speciesConfusion.upsert({
        where: {
          fishSpeciesId_confusedWithSpeciesId_countryScope: {
            fishSpeciesId: primaryId,
            confusedWithSpeciesId: confusedId,
            countryScope: CONFUSION_SEED.countryScope,
          },
        },
        create: {
          fishSpeciesId: primaryId,
          confusedWithSpeciesId: confusedId,
          misappliedNameTr: CONFUSION_SEED.misappliedNameTr,
          reasonEn: CONFUSION_SEED.reasonEn,
          reasonTr: CONFUSION_SEED.reasonTr,
          countryScope: CONFUSION_SEED.countryScope,
        },
        update: {
          misappliedNameTr: CONFUSION_SEED.misappliedNameTr,
          reasonEn: CONFUSION_SEED.reasonEn,
          reasonTr: CONFUSION_SEED.reasonTr,
        },
      });
    }
  } catch {
    // DB unavailable during build
  }
}
