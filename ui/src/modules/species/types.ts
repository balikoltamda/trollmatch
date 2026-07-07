import type { ContentLifecycleState, IucnRedListStatus } from "@/generated/prisma/client";
import type { CatchReportSummary } from "@/modules/catch-report/types";
import type { LocalizedPair } from "@/modules/discovery/types";

export type SpeciesProfileView = {
  description: LocalizedPair | null;
  habitat: LocalizedPair | null;
  distribution: LocalizedPair | null;
  depthMinM: number | null;
  depthMaxM: number | null;
  spawning: LocalizedPair | null;
  maxLengthCm: number | null;
  maxWeightG: number | null;
  conservation: LocalizedPair | null;
  faoAreas: string[];
  iucnStatus: IucnRedListStatus | null;
  lifecycleState: ContentLifecycleState;
};

export type SpeciesClassificationView = {
  kingdom: string | null;
  phylum: string | null;
  className: string | null;
  orderName: string | null;
  family: string | null;
  genus: string | null;
};

export type SpeciesRegionalNotesView = {
  mediterranean: LocalizedPair | null;
  aegean: LocalizedPair | null;
  northernCyprus: LocalizedPair | null;
};

export type SpeciesImageView = {
  url: string;
  alt: LocalizedPair;
  role: "HERO" | "GALLERY";
};

export type SpeciesTechniqueView = {
  slug: string;
  name: LocalizedPair;
  /** Approved catch reports mentioning this technique — community evidence only. */
  reportCount?: number;
  totalCatches?: number;
};

export type SpeciesCompassData = {
  profile: SpeciesProfileView | null;
  classification: SpeciesClassificationView | null;
  regionalNotes: SpeciesRegionalNotesView | null;
  heroImageUrl: string | null;
  gallery: SpeciesImageView[];
  techniques: SpeciesTechniqueView[];
  catchReports: CatchReportSummary[];
  communityStatistics: import("@/modules/lure/types/lure-detail").CommunityStatistics;
};
