import { FISHING_LINE_FAMILY } from "@/modules/terminology/data/fishing-line";
import { LEADER_FAMILY } from "@/modules/terminology/data/leader";
import { REFERENCE_SPECIES_TERMS } from "@/modules/terminology/data/reference-species";
import type { LexiconRegistry, LexiconTerm } from "@/modules/terminology/types";

/** Sprint 7.2 seed registry — authoritative starter vocabulary. */
export const LEXICON_SEED_TERMS: LexiconTerm[] = [
  ...FISHING_LINE_FAMILY,
  ...LEADER_FAMILY,
  ...REFERENCE_SPECIES_TERMS,
];

export const LEXICON_REGISTRY: LexiconRegistry = {
  version: "2025-07-06.1",
  terms: LEXICON_SEED_TERMS,
};

export function getLexiconTermById(id: string): LexiconTerm | undefined {
  return LEXICON_SEED_TERMS.find((term) => term.id === id);
}

export function getLexiconChildren(parentId: string): LexiconTerm[] {
  return LEXICON_SEED_TERMS.filter((term) => term.parentId === parentId);
}
