/**
 * Balık Oltamda Fishing Lexicon — canonical terminology types.
 *
 * Turkish and English labels are independently localized angler language.
 * They are NOT translation pairs. See docs/fishing/LOCALIZATION_GUIDE.md.
 *
 * Not wired into UI, search, or importers yet (Sprint 7.2 foundation only).
 */

export type LexiconLocale = "en" | "tr";

/** How an alias relates to the preferred term. */
export type TermAliasKind =
  | "search_term"
  | "regional"
  | "deprecated"
  | "scientific"
  | "international"
  | "misspelling"
  | "synonym"
  | "manufacturer";

/** Top-level vocabulary domain. */
export type TermDomain =
  | "tackle"
  | "rigging"
  | "line"
  | "leader"
  | "technique"
  | "species"
  | "habitat"
  | "measurement"
  | "general";

/**
 * Independently localized preferred label per locale.
 * `en` and `tr` are authored separately — never machine-translated.
 */
export type PreferredTermLabels = {
  en: string;
  tr: string;
};

export type TermAlias = {
  label: string;
  locale: LexiconLocale | "any";
  kind: TermAliasKind;
  /** ISO 3166-1 alpha-2 or platform region id (e.g. eastern-mediterranean). */
  regionScope?: string;
  notes?: string;
};

export type DeprecatedTerm = {
  label: string;
  locale: LexiconLocale;
  /** Why this term must not be used as preferred or in UI copy. */
  reason: string;
};

export type RegionalTerm = {
  label: string;
  locale: LexiconLocale;
  regionScope: string;
  notes?: string;
};

export type LexiconTermNotes = {
  en: string;
  tr: string;
};

/**
 * A single canonical lexicon entry.
 * `id` is the stable slug used across UI, search, AI, importers, Studio, and APIs.
 */
export type LexiconTerm = {
  id: string;
  domain: TermDomain;
  preferred: PreferredTermLabels;
  aliases: TermAlias[];
  deprecatedTerms: DeprecatedTerm[];
  regionalTerms: RegionalTerm[];
  /** Scientific nomenclature where applicable (species, formal material names). */
  scientificTerms: string[];
  /** Internationally standardized or manufacturer-neutral labels (e.g. IGFA, ISO). */
  internationalTerms: string[];
  notes: LexiconTermNotes;
  /** Parent term id for hierarchical vocabulary (e.g. monofilament-line → fishing-line). */
  parentId?: string;
};

export type LexiconRegistry = {
  terms: LexiconTerm[];
  version: string;
};
