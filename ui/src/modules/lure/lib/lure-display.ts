import type { LureDetail } from "@/modules/lure/types/lure-detail";

export function localize<T extends Record<string, string>>(
  value: T,
  locale: keyof T,
): string {
  return value[locale] ?? value.en ?? Object.values(value)[0] ?? "";
}

export function getActiveVariant(
  lure: LureDetail,
  variantId?: string,
): LureDetail["variants"][number] {
  const match = lure.variants.find((v) => v.id === variantId);
  if (match) return match;
  return (
    lure.variants.find((v) => v.id === lure.defaultVariantId) ??
    lure.variants[0]
  );
}

export function formatPatternCount(
  count: number,
  locale: string,
): string {
  return locale === "tr" ? `${count} Desen` : `${count} Patterns`;
}
