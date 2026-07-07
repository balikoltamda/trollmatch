import type { AppLocale } from "@/i18n/routing";
import type { Prisma } from "@/generated/prisma/client";

const TR_CHAR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

function transliterateTurkish(value: string): string {
  return value.replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => TR_CHAR_MAP[ch] ?? ch);
}

function baseSlugify(value: string): string {
  return transliterateTurkish(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function slugifySpeciesEn(value: string): string {
  const slug = baseSlugify(value);
  return slug || "species";
}

export function slugifySpeciesTr(value: string): string {
  const slug = value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u00C0-\u024F-]+/gi, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return slug || slugifySpeciesEn(value);
}

export function speciesLocaleSlug(
  species: { slugEn: string; slugTr: string; slug?: string },
  locale: AppLocale,
): string {
  return locale === "tr" ? species.slugTr : species.slugEn;
}

export function speciesPublicSlugWhere(
  slug: string,
  locale: AppLocale,
): Prisma.FishSpeciesWhereInput {
  if (locale === "tr") {
    return {
      deletedAt: null,
      OR: [{ slugTr: slug }, { slugEn: slug }, { slug }],
    };
  }
  return {
    deletedAt: null,
    OR: [{ slugEn: slug }, { slugTr: slug }, { slug }],
  };
}

export function speciesCanonicalSlugEn(species: {
  slugEn: string;
  slug?: string;
}): string {
  return species.slugEn || species.slug || "";
}
