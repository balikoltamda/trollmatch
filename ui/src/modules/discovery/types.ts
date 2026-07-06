import type { SpeciesTopLureFromReports } from "@/modules/catch-report/types";

export type LocalizedPair = { en: string; tr: string };

export type LureCardData = {
  slug: string;
  manufacturer: LocalizedPair;
  modelName: LocalizedPair;
  formFactor: LocalizedPair;
  imageSrc: string;
  verified: boolean;
};

export type SpeciesCardData = {
  slug: string;
  name: LocalizedPair;
  subtitle: LocalizedPair;
  lureCount: number;
};

export type SpeciesDetailData = {
  slug: string;
  name: LocalizedPair;
  scientificName: string;
  lureCount: number;
  lures: LureCardData[];
  topLuresFromReports: SpeciesTopLureFromReports[];
};

export type PublicLureListResult = {
  rows: LureCardData[];
  total: number;
  page: number;
  pageSize: number;
  query: string | null;
  speciesSlug: string | null;
};

export type HomeDiscoveryData = {
  species: SpeciesCardData[];
  latestLures: LureCardData[];
  stats: {
    lureCount: number;
    speciesCount: number;
    manufacturerCount: number;
  };
  fromDatabase: boolean;
};
