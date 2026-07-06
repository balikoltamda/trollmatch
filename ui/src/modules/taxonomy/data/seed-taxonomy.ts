import type { SpeciesAliasKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeSpeciesLabel } from "@/modules/taxonomy/lib/normalize-species-label";

type SpeciesSeed = {
  slug: string;
  scientificName: string;
  nameEn: string;
  nameTr: string;
  editorialNotesEn?: string;
  editorialNotesTr?: string;
  aliases: Array<{
    alias: string;
    kind: SpeciesAliasKind;
    locale?: string;
    countryScope?: string;
  }>;
  regionalNames: Array<{
    name: string;
    locale: string;
    countryScope: string;
  }>;
};

const REFERENCE_SPECIES: SpeciesSeed[] = [
  {
    slug: "lichia-amia",
    scientificName: "Lichia amia",
    nameEn: "Leerfish",
    nameTr: "Akya",
    editorialNotesEn:
      "Canonical owner of the Turkish name Akya. Not to be confused with greater amberjack.",
    editorialNotesTr:
      "Türkçe Akya adının doğru türü. Sarı kuyruk (Seriola) ile karıştırılmamalı.",
    aliases: [
      { alias: "Liça", kind: "SYNONYM", locale: "tr" },
      { alias: "Litsa", kind: "SYNONYM", locale: "tr" },
      { alias: "Çatal Kuyruk", kind: "SEARCH_TERM", locale: "tr" },
      { alias: "Çıplak", kind: "SEARCH_TERM", locale: "tr" },
    ],
    regionalNames: [{ name: "Litsa", locale: "tr", countryScope: "KKTC" }],
  },
  {
    slug: "seriola-dumerili",
    scientificName: "Seriola dumerili",
    nameEn: "Greater amberjack",
    nameTr: "Kuzu",
    editorialNotesEn:
      "Do not use Akya as an alias — that name belongs to Lichia amia. KKTC anglers may say Mineri.",
    editorialNotesTr:
      "Akya takma ad olarak kullanılmaz — Akya Lichia amia türüne aittir. KKTC'de Mineri denir.",
    aliases: [
      { alias: "Sarı Kuyruk", kind: "SEARCH_TERM", locale: "tr" },
    ],
    regionalNames: [{ name: "Mineri", locale: "tr", countryScope: "KKTC" }],
  },
];

const CONFUSION_SEED = {
  primarySlug: "lichia-amia",
  confusedSlug: "seriola-dumerili",
  misappliedNameTr: "Akya",
  reasonEn:
    "Some regions incorrectly use the name Akya for Seriola dumerili. Akya is the preferred Turkish name for Lichia amia.",
  reasonTr:
    "Bazı bölgelerde Akya adı yanlışlıkla Seriola dumerili için kullanılır. Akya, Lichia amia türünün tercih edilen Türkçe adıdır.",
  countryScope: "TR",
};

async function upsertSpecies(seed: SpeciesSeed) {
  const species = await prisma.fishSpecies.upsert({
    where: { slug: seed.slug },
    create: {
      slug: seed.slug,
      scientificName: seed.scientificName,
      nameEn: seed.nameEn,
      nameTr: seed.nameTr,
      editorialNotesEn: seed.editorialNotesEn ?? null,
      editorialNotesTr: seed.editorialNotesTr ?? null,
    },
    update: {
      scientificName: seed.scientificName,
      nameEn: seed.nameEn,
      nameTr: seed.nameTr,
      editorialNotesEn: seed.editorialNotesEn ?? null,
      editorialNotesTr: seed.editorialNotesTr ?? null,
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
    const speciesBySlug = new Map<string, string>();

    for (const seed of REFERENCE_SPECIES) {
      const species = await upsertSpecies(seed);
      speciesBySlug.set(seed.slug, species.id);
    }

    const primaryId = speciesBySlug.get(CONFUSION_SEED.primarySlug);
    const confusedId = speciesBySlug.get(CONFUSION_SEED.confusedSlug);

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
