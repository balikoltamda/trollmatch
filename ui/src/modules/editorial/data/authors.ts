import type { AuthorProfile } from "@/modules/editorial/types";

export const BALIK_OLTAMDA_EDITORIAL_SLUG = "balik-oltamda-editorial";

export const EDITORIAL_AUTHORS: Record<string, AuthorProfile> = {
  [BALIK_OLTAMDA_EDITORIAL_SLUG]: {
    slug: BALIK_OLTAMDA_EDITORIAL_SLUG,
    name: {
      en: "Balık Oltamda Editorial",
      tr: "Balık Oltamda Editörleri",
    },
    role: {
      en: "Editorial team",
      tr: "Editör ekibi",
    },
    organizationSlug: "balik-oltamda",
    bio: {
      en: "Experienced anglers and editors who verify manufacturer data against real catch reports before publishing on TrollMatch.",
      tr: "Üretici verilerini gerçek av raporlarıyla karşılaştırarak TrollMatch'te yayımlamadan önce doğrulayan deneyimli balıkçılar ve editörler.",
    },
    profileReady: true,
  },
};

export function getAuthorBySlug(slug: string): AuthorProfile | null {
  return EDITORIAL_AUTHORS[slug] ?? null;
}
