import type { CanonicalLocalizedText } from "../core/canonical-lure";

export function normalizeAlias(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveLocalized(
  text: CanonicalLocalizedText,
  locale: "en" | "tr",
): string {
  return (
    text[locale] ??
    text.default ??
    text.en ??
    text.tr ??
    ""
  ).trim();
}

export function slugifyColorCode(
  manufacturerSlug: string,
  colorCode: string,
): string {
  const code = colorCode.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${manufacturerSlug}-${code}`;
}
