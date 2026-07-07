import type {
  ContentLifecycleState,
  EditorNoteConfidence,
  ManufacturerProductStatus,
} from "@/generated/prisma/client";

export type TrustProvenanceItem = {
  label: string;
  value: string;
};

export type TrustLayer = {
  id: string;
  title: string;
  summary: string;
  confidence: EditorNoteConfidence | null;
  evidence: string[];
  provenance: TrustProvenanceItem[];
  verified: boolean;
};

export type CommunityConsensus = {
  assertions: number;
  catchReports: number;
  effectivenessBand: string;
  summary: string;
};

export type EditorialVerification = {
  status: ContentLifecycleState;
  statusLabel: string;
  lastVerifiedAt: Date | null;
  editorConfidence: EditorNoteConfidence | null;
  published: boolean;
};

export type TrustProfile = {
  score: number;
  headline: string;
  answer: string;
  layers: TrustLayer[];
  scoreBreakdown: TrustScoreFactor[];
  communityConsensus: CommunityConsensus | null;
  editorialVerification: EditorialVerification;
  pendingVerificationCount: number;
  manufacturerStatus: ManufacturerProductStatus;
};

export type TrustScoreFactor = {
  label: string;
  delta: number;
  tone: "positive" | "negative" | "neutral";
  category?: string;
};

export type PublicTrustSummary = {
  score: number;
  answer: string;
  manufacturerImportedAt: string | null;
  editorConfidence: EditorNoteConfidence | null;
  published: boolean;
  communityConsensus: CommunityConsensus | null;
  evidence: string[];
  provenance: TrustProvenanceItem[];
  lastVerifiedAt: string | null;
  editorialReviewPublished: boolean;
  sourceCount: number;
};
