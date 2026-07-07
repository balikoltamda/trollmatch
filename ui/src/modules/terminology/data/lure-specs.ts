/**
 * Turkish fishing terminology for lure spec labels.
 * Names follow TrollMatch lexicon — not literal machine translation.
 */

export type LureSpecTerm = {
  en: string;
  tr: string;
};

export const LURE_SPEC_LABELS: Record<string, LureSpecTerm> = {
  range: { en: "Range", tr: "Dalış Derinliği" },
  divingDepth: { en: "Diving depth", tr: "Dalış Derinliği" },
  floating: { en: "Floating", tr: "Floating (Yüzen)" },
  suspending: { en: "Suspending", tr: "Suspend (Askıda)" },
  sinking: { en: "Sinking", tr: "Sinking (Batan)" },
  "slow-sinking": { en: "Slow sinking", tr: "Sinking (Yavaş Batan)" },
  "fast-sinking": { en: "Fast sinking", tr: "Sinking (Hızlı Batan)" },
  topwater: { en: "Topwater", tr: "Su Üstü" },
  surface: { en: "Surface", tr: "Su Üstü" },
  action: { en: "Action", tr: "Aksiyon" },
  length: { en: "Length", tr: "Boy" },
  weight: { en: "Weight", tr: "Ağırlık" },
  hooks: { en: "Hooks", tr: "İğne" },
  splitRings: { en: "Split rings", tr: "Halka" },
  technology: { en: "Technology", tr: "Teknoloji" },
  trollingSpeed: { en: "Trolling speed", tr: "Sürüntü Hızı" },
  shoreCasting: { en: "Shore casting", tr: "Kıyı At-Çek" },
  spinning: { en: "Spinning", tr: "Spin Avı" },
  verticalJigging: { en: "Vertical jigging", tr: "Dikey Jig" },
  castingRange: { en: "Casting range", tr: "Atış Mesafesi" },
};

export const BUOYANCY_TR: Record<string, string> = {
  floating: "Floating (Yüzen)",
  suspending: "Suspend (Askıda)",
  sinking: "Sinking (Batan)",
  "slow-sinking": "Sinking (Yavaş Batan)",
  "fast-sinking": "Sinking (Hızlı Batan)",
  neutral: "Nötr",
};

export function localizeBuoyancy(slug: string | undefined, fallbackEn?: string): string {
  if (slug && BUOYANCY_TR[slug]) return BUOYANCY_TR[slug];
  if (fallbackEn?.toLowerCase().includes("float")) return BUOYANCY_TR.floating;
  if (fallbackEn?.toLowerCase().includes("suspend")) return BUOYANCY_TR.suspending;
  if (fallbackEn?.toLowerCase().includes("sink")) return BUOYANCY_TR.sinking;
  return fallbackEn ?? "";
}

export function localizeSpecLabel(key: string): LureSpecTerm {
  return LURE_SPEC_LABELS[key] ?? { en: key, tr: key };
}

/** Simple phrase replacements for technology description localization. */
const TECH_PHRASE_TR: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bweight transfer\b/i, replacement: "ağırlık transferi" },
  { pattern: /\bmagnetic\b/i, replacement: "manyetik" },
  { pattern: /\bprism finish\b/i, replacement: "prizma kaplama" },
  { pattern: /\bholographic\b/i, replacement: "holografik" },
  { pattern: /\buv reactive\b/i, replacement: "UV reaktif" },
  { pattern: /\blong cast\b/i, replacement: "uzun mesafe atış" },
  { pattern: /\bstable action\b/i, replacement: "stabil aksiyon" },
  { pattern: /\bwave motion\b/i, replacement: "dalga hareketi" },
];

export function localizeTechnologyDescription(en: string): string {
  let tr = en;
  for (const { pattern, replacement } of TECH_PHRASE_TR) {
    tr = tr.replace(pattern, replacement);
  }
  return tr;
}

/** Buoyancy label for editorial prose — manufacturer term preserved in parentheses. */
export function formatBuoyancyProse(slug: string | undefined, fallbackEn?: string): string {
  if (slug && BUOYANCY_TR[slug]) return BUOYANCY_TR[slug];
  return localizeBuoyancy(slug, fallbackEn);
}

/** Normalize action wording for Turkish editorial copy (Stop & Go, S-Curve, etc.). */
export function formatActionProse(actionEn: string): string {
  const normalized = actionEn.trim();
  const replacements: Array<[RegExp, string]> = [
    [/\bstop\s*[-&]?\s*go\b/i, "Stop & Go"],
    [/\bs[- ]?curve\b/i, "S-Curve"],
    [/\bwide\s*wobble\b/i, "Wide Wobble"],
    [/\btight\s*wobble\b/i, "Tight Wobble"],
    [/\brolling\b/i, "Rolling"],
    [/\bdarting\b/i, "Darting"],
  ];
  let result = normalized;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
