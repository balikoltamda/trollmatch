import type { SpeciesTechniqueLureGroup } from "@/modules/catch-report/types";

export type LocalizedPair = { en: string; tr: string };

export type LureCardData = {
  slug: string;
  manufacturer: LocalizedPair;
  modelName: LocalizedPair;
  formFactor: LocalizedPair;
  imageSrc: string;
  verified: boolean;
};

export type SpeciesRegionLabel = {
  en: string;
  tr: string;
  code: string;
};

export type SpeciesCardData = {
  slug: string;
  slugEn: string;
  slugTr: string;
  name: LocalizedPair;
  scientificName: string;
  regions: SpeciesRegionLabel[];
  lureCount: number;
  heroImageUrl: string | null;
};

export type SpeciesDetailData = {
  slug: string;
  slugEn: string;
  slugTr: string;
  name: LocalizedPair;
  scientificName: string;
  habitat: LocalizedPair;
  maxLengthCm: number | null;
  maxWeightG: number | null;
  description: LocalizedPair;
  regions: SpeciesRegionLabel[];
  lureCount: number;
  lures: LureCardData[];
  topLuresByTechnique: SpeciesTechniqueLureGroup[];
};

export type PublicLureListResult = {
  rows: LureCardData[];
  total: number;
  page: number;
  pageSize: number;
  query: string | null;
  speciesSlug: string | null;
};

export type HomeManufacturerData = {
  slug: string;
  name: string;
  countryCode: string | null;
  productCount: number;
};

export type HomeDiscoveryData = {
  species: SpeciesCardData[];
  latestLures: LureCardData[];
  manufacturers: HomeManufacturerData[];
  stats: {
    lureCount: number;
    speciesCount: number;
    manufacturerCount: number;
    importBatchCount: number;
  };
  fromDatabase: boolean;
};
