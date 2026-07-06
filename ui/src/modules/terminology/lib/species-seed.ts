import type { SpeciesAliasKind } from "@/generated/prisma/client";
import type { LexiconTerm, TermAliasKind } from "@/modules/terminology/types";

export type SpeciesSeedFromLexicon = {
  lexiconTermId: string;
  slug: string;
  scientificName: string;
  nameEn: string;
  nameTr: string;
  editorialNotesEn: string;
  editorialNotesTr: string;
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

const LEXICON_ALIAS_TO_SPECIES: Partial<
  Record<TermAliasKind, SpeciesAliasKind>
> = {
  synonym: "SYNONYM",
  search_term: "SEARCH_TERM",
  international: "SEARCH_TERM",
  misspelling: "MISSPELLING",
};

function mapAliasKind(kind: TermAliasKind): SpeciesAliasKind {
  return LEXICON_ALIAS_TO_SPECIES[kind] ?? "SEARCH_TERM";
}

/**
 * Build a FishSpecies seed from an authoritative lexicon entry.
 * Deprecated lexicon labels are excluded — they must not become species aliases.
 */
export function lexiconTermToSpeciesSeed(
  term: LexiconTerm,
): SpeciesSeedFromLexicon {
  const scientificName = term.scientificTerms[0];
  if (!scientificName) {
    throw new Error(
      `Lexicon term "${term.id}" requires at least one scientificTerms entry`,
    );
  }

  return {
    lexiconTermId: term.id,
    slug: term.id,
    scientificName,
    nameEn: term.preferred.en,
    nameTr: term.preferred.tr,
    editorialNotesEn: term.notes.en,
    editorialNotesTr: term.notes.tr,
    aliases: term.aliases.map((alias) => ({
      alias: alias.label,
      kind: mapAliasKind(alias.kind),
      locale: alias.locale === "any" ? undefined : alias.locale,
      countryScope: alias.regionScope,
    })),
    regionalNames: term.regionalTerms.map((regional) => ({
      name: regional.label,
      locale: regional.locale,
      countryScope: regional.regionScope,
    })),
  };
}
