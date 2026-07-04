import type { AppLocale } from "@/i18n/routing";

export type VerificationStatus =
  | "unverified"
  | "partially_verified"
  | "manufacturer_verified"
  | "moderator_verified"
  | "expert_endorsed";

export type LocalizedString = Record<AppLocale, string>;

export type LureVariant = {
  id: string;
  label: LocalizedString;
  lengthMm: number;
  weightG: number;
  colorCode: string;
  imageSrc: string;
};

export type LureSpecifications = {
  lengthMm: number;
  weightG: number;
  divingDepthM?: { min: number; max: number };
  buoyancy?: LocalizedString;
  action?: LocalizedString;
  bodyType?: LocalizedString;
  coatingType?: LocalizedString;
};

export type LureSpecies = {
  id: string;
  name: LocalizedString;
  kind: "curated" | "marketing" | "community";
};

export type LureTechnique = {
  id: string;
  name: LocalizedString;
};

export type TrollingInfo = {
  speedKnots?: { min: number; max: number };
  leader?: LocalizedString;
  mainLine?: LocalizedString;
  notes?: LocalizedString;
};

export type CommunityStatistics = {
  usageAssertionCount: number;
  verifiedCatchReportCount: number;
  effectivenessBand: "low" | "moderate" | "high" | "insufficient_data";
  topRegions: LocalizedString[];
};

export type AiInsight = {
  summary: LocalizedString;
  corpusDate: string;
  citations: LocalizedString[];
};

export type RelatedLure = {
  slug: string;
  manufacturer: LocalizedString;
  modelName: LocalizedString;
  formFactor: LocalizedString;
  imageSrc: string;
};

export type SponsoredLink = {
  retailer: LocalizedString;
  disclosure: LocalizedString;
};

export type ChangeHistoryEntry = {
  date: string;
  description: LocalizedString;
  actor: LocalizedString;
};

export type LureDetail = {
  slug: string;
  manufacturer: LocalizedString;
  productLine: LocalizedString;
  modelName: LocalizedString;
  formFactor: LocalizedString;
  shortDescription: LocalizedString;
  verificationStatus: VerificationStatus;
  lastVerifiedAt: string;
  defaultVariantId: string;
  variants: LureVariant[];
  specifications: LureSpecifications;
  recommendedSpecies: LureSpecies[];
  recommendedTechniques: LureTechnique[];
  trolling?: TrollingInfo;
  communityStatistics: CommunityStatistics;
  aiInsights: AiInsight;
  relatedLures: RelatedLure[];
  sponsoredLinks: SponsoredLink[];
  changeHistory: ChangeHistoryEntry[];
  trust: import("@/modules/trust/types").PublicTrustSummary;
};

export type LureDetailParams = {
  slug: string;
  locale: AppLocale;
  variantId?: string;
};
