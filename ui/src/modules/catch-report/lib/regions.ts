import type { LocalizedString } from "@/modules/lure/types/lure-detail";

/** Known region slugs from catch report forms — extend when new regions are added. */
export const CATCH_REPORT_REGION_LABELS: Record<string, LocalizedString> = {
  aegean: { en: "Aegean", tr: "Ege" },
  bosphorus: { en: "Bosphorus & Marmara", tr: "Boğaz & Marmara" },
  mediterranean: { en: "Mediterranean", tr: "Akdeniz" },
  "northern-cyprus": { en: "Northern Cyprus", tr: "Kıbrıs" },
};

export function regionLabel(regionSlug: string): LocalizedString {
  return (
    CATCH_REPORT_REGION_LABELS[regionSlug] ?? {
      en: regionSlug,
      tr: regionSlug,
    }
  );
}
