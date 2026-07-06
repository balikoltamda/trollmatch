import type { LexiconTerm } from "@/modules/terminology/types";

/**
 * Reference species — Sprint 7.4.1 lexicon entries.
 * Taxonomy seeds derive display names from these terms (lexicon-first gate).
 */
export const LICHIA_AMIA_TERM: LexiconTerm = {
  id: "lichia-amia",
  domain: "species",
  preferred: {
    en: "Leerfish",
    tr: "Akya",
  },
  aliases: [
    { label: "Liça", locale: "tr", kind: "synonym" },
    { label: "Litsa", locale: "tr", kind: "synonym" },
    { label: "Çatal Kuyruk", locale: "tr", kind: "search_term" },
    { label: "Çıplak", locale: "tr", kind: "search_term" },
  ],
  deprecatedTerms: [],
  regionalTerms: [
    { label: "Litsa", locale: "tr", regionScope: "KKTC" },
  ],
  scientificTerms: ["Lichia amia"],
  internationalTerms: ["leerfish"],
  notes: {
    en: "Canonical owner of the Turkish name Akya. Not to be confused with greater amberjack (Seriola dumerili).",
    tr: "Türkçe Akya adının doğru türü. Sarı kuyruk (Seriola) ile karıştırılmamalı.",
  },
};

export const SERIOLA_DUMERILI_TERM: LexiconTerm = {
  id: "seriola-dumerili",
  domain: "species",
  preferred: {
    en: "Greater amberjack",
    tr: "Kuzu",
  },
  aliases: [
    { label: "Sarı Kuyruk", locale: "tr", kind: "search_term" },
  ],
  deprecatedTerms: [
    {
      label: "Akya",
      locale: "tr",
      reason:
        "Akya belongs to Lichia amia. Some regions incorrectly use Akya for Seriola dumerili — document in SpeciesConfusion, never as alias.",
    },
  ],
  regionalTerms: [
    { label: "Mineri", locale: "tr", regionScope: "KKTC" },
  ],
  scientificTerms: ["Seriola dumerili"],
  internationalTerms: ["greater amberjack", "amberjack"],
  notes: {
    en: "Do not use Akya as an alias — that name belongs to Lichia amia. KKTC anglers may say Mineri.",
    tr: "Akya takma ad olarak kullanılmaz — Akya Lichia amia türüne aittir. KKTC'de Mineri denir.",
  },
};

export const REFERENCE_SPECIES_TERMS: LexiconTerm[] = [
  LICHIA_AMIA_TERM,
  SERIOLA_DUMERILI_TERM,
];

export const REFERENCE_SPECIES_LEXICON_IDS = [
  "lichia-amia",
  "seriola-dumerili",
] as const;
