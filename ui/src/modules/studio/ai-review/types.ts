import type {
  StudioReviewEntityType,
  SuggestionSource,
  SuggestionStatus,
} from "@/generated/prisma/client";

export type AiReviewEntityType = StudioReviewEntityType;

export type SpeciesSeedInput = {
  nameTr?: string;
  nameEn?: string;
  scientificName?: string;
};

export type TechniqueSeedInput = {
  nameTr?: string;
  nameEn?: string;
};

export type ManufacturerSeedInput = {
  nameEn?: string;
  nameTr?: string;
};

export type LureSeedInput = {
  nameEn?: string;
  nameTr?: string;
  manufacturerSlug?: string;
};

export type KnowledgeSourceSeedInput = {
  title?: string;
  url?: string;
};

export type RegionSeedInput = {
  nameEn?: string;
  nameTr?: string;
  code?: string;
};

export type CatchReportSeedInput = {
  reportId?: string;
  techniqueId?: string;
};

export type AiSuggestionDraft = {
  fieldKey: string;
  fieldLabel: string;
  suggestedValue: string;
  currentValue?: string | null;
  confidencePct: number;
  source: SuggestionSource;
  reasoning: string;
  provenance?: Record<string, unknown> | null;
};

export type AiSuggestionView = AiSuggestionDraft & {
  id: string;
  sessionId: string;
  entityType: AiReviewEntityType;
  entityId: string | null;
  status: SuggestionStatus;
  editedValue: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  provenance?: Record<string, unknown> | null;
};

export type AiReviewSessionView = {
  id: string;
  entityType: AiReviewEntityType;
  entityId: string | null;
  seedInput: Record<string, unknown>;
  createdAt: Date;
  suggestions: AiSuggestionView[];
};

export type DuplicateMatch = {
  entityType: AiReviewEntityType;
  entityId: string;
  label: string;
  matchedOn: string;
  matchKind:
    | "scientific_name"
    | "preferred_name"
    | "alias"
    | "slug"
    | "similarity";
  similarityPct: number;
};

export type AiReviewStatusSummary = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

export const AI_SOURCE_LABELS: Record<SuggestionSource, string> = {
  IMPORTER: "Importer",
  AI_ENRICHMENT: "AI enrichment",
  COMMUNITY_REPORT: "Community report",
  AI_SUMMARY: "AI summary",
  EDITOR: "Editor",
};
