import type { SpeciesDetailData } from "@/modules/discovery/types";
import type { AppLocale } from "@/i18n/routing";
import {
  buildSpeciesStructuredData,
} from "@/modules/species/lib/seo";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesStructuredDataProps = {
  locale: AppLocale;
  species: SpeciesDetailData;
  heroImageUrl: string | null;
};

export function SpeciesStructuredData({
  locale,
  species,
  heroImageUrl,
}: SpeciesStructuredDataProps) {
  const payload = buildSpeciesStructuredData(
    {
      slugEn: species.slugEn,
      slugTr: species.slugTr,
      name: species.name,
      scientificName: species.scientificName,
      description: species.description,
      heroImageUrl,
    },
    locale,
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export function formatSpeciesMaxSize(
  species: SpeciesDetailData,
  locale: AppLocale,
  labels: { length: string; weight: string; separator: string },
): string | null {
  const parts: string[] = [];
  if (species.maxLengthCm) {
    parts.push(`${labels.length}: ${species.maxLengthCm} cm`);
  }
  if (species.maxWeightG) {
    const kg = (species.maxWeightG / 1000).toFixed(1);
    parts.push(`${labels.weight}: ${kg} kg`);
  }
  return parts.length > 0 ? parts.join(labels.separator) : null;
}

export function formatSpeciesRegions(
  species: SpeciesDetailData,
  locale: AppLocale,
): string {
  if (species.regions.length === 0) return "";
  return species.regions
    .map((region) => pickLocalized({ en: region.en, tr: region.tr }, locale))
    .join(" · ");
}
