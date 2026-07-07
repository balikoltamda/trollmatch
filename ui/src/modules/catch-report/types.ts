import type {
  BoatOrShore,
  CatchReportVerificationStatus,
} from "@/generated/prisma/client";

export type CatchReportSummary = {
  id: string;
  fishSpeciesName: { en: string; tr: string };
  fishSpeciesSlug: string;
  lureModelSlug: string;
  lureModelName: { en: string; tr: string };
  lureVariantLabel: { en: string; tr: string };
  techniqueName: { en: string; tr: string } | null;
  techniqueId: string | null;
  country: string;
  region: string;
  location: string | null;
  month: number;
  year: number;
  boatOrShore: BoatOrShore;
  catchCount: number;
  largestLengthCm: number | null;
  largestWeightG: number | null;
  photoCount: number;
  notes: string | null;
  verificationStatus: CatchReportVerificationStatus;
  createdAt: Date;
};

export type CatchReportReviewRow = CatchReportSummary & {
  manufacturerName: string;
  mergedIntoId: string | null;
};

export type CatchReportFormSpecies = {
  id: string;
  slug: string;
  name: { en: string; tr: string };
};

export type CatchReportFormVariant = {
  id: string;
  slug: string;
  label: { en: string; tr: string };
};

export type CatchReportFormTechnique = {
  id: string;
  slug: string;
  name: { en: string; tr: string };
};

export type CatchReportFormContext = {
  lureModelId: string;
  lureSlug: string;
  species: CatchReportFormSpecies[];
  variants: CatchReportFormVariant[];
  techniques: CatchReportFormTechnique[];
};

export type SpeciesTopLureFromReports = {
  slug: string;
  manufacturer: { en: string; tr: string };
  modelName: { en: string; tr: string };
  formFactor: { en: string; tr: string };
  imageSrc: string;
  reportCount: number;
  totalCatches: number;
};

/** Approved catch reports aggregated per technique — Species → Technique → Lure. */
export type SpeciesTechniqueLureGroup = {
  technique: {
    slug: string;
    name: { en: string; tr: string };
  };
  lures: SpeciesTopLureFromReports[];
};

export type SubmitCatchReportInput = {
  fishSpeciesId: string;
  lureVariantId: string;
  techniqueId: string;
  country: string;
  region: string;
  location?: string | null;
  month: number;
  year: number;
  boatOrShore: BoatOrShore;
  catchCount: number;
  notes?: string | null;
  waterDepthM?: number | null;
  lureDepthM?: number | null;
  trollingSpeedKn?: number | null;
  largestLengthCm?: number | null;
  largestWeightG?: number | null;
  photoCount?: number;
};
