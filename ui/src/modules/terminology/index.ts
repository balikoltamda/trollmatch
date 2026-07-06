/**
 * Balık Oltamda Fishing Lexicon
 *
 * Canonical terminology for the entire platform. Not a translation dictionary.
 * See docs/fishing/ for authoritative human-readable references.
 *
 * Sprint 7.2: types + seed data only. Not wired into UI, search, or importers.
 */

export type {
  DeprecatedTerm,
  LexiconLocale,
  LexiconRegistry,
  LexiconTerm,
  LexiconTermNotes,
  PreferredTermLabels,
  RegionalTerm,
  TermAlias,
  TermAliasKind,
  TermDomain,
} from "@/modules/terminology/types";

export {
  getLexiconChildren,
  getLexiconTermById,
  LEXICON_REGISTRY,
  LEXICON_SEED_TERMS,
} from "@/modules/terminology/data";

export { normalizeTermLabel } from "@/modules/terminology/lib/normalize-label";
