import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { getClientEnv } from "@/lib/env";
import type { LocalizedPair } from "@/modules/discovery/types";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesSeoInput = {
  slugEn: string;
  slugTr: string;
  name: LocalizedPair;
  scientificName: string;
  description: LocalizedPair | null;
  heroImageUrl: string | null;
};

export function speciesCanonicalPath(
  species: { slugEn: string; slugTr: string },
  locale: AppLocale,
): string {
  const slug = locale === "tr" ? species.slugTr : species.slugEn;
  return `/${locale}/species/${slug}`;
}

export function buildSpeciesStructuredData(
  input: SpeciesSeoInput,
  locale: AppLocale,
): Record<string, unknown> {
  const name = pickLocalized(input.name, locale);
  const description =
    pickLocalized(input.description ?? { en: "", tr: "" }, locale) ||
    `${name} (${input.scientificName})`;

  return {
    "@context": "https://schema.org",
    "@type": "Taxon",
    name,
    alternateName: input.scientificName,
    scientificName: input.scientificName,
    description,
    ...(input.heroImageUrl ? { image: input.heroImageUrl } : {}),
    url: `${getClientEnv().NEXT_PUBLIC_SITE_URL}${speciesCanonicalPath(input, locale)}`,
  };
}

export function speciesAlternateLanguages(
  species: { slugEn: string; slugTr: string },
): Record<string, string> {
  return Object.fromEntries(
    routing.locales.map((loc) => [
      loc,
      speciesCanonicalPath(species, loc as AppLocale),
    ]),
  );
}
