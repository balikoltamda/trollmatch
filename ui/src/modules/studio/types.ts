import type {
  CatalogAuditAction,
  ContentLifecycleState,
  EditorNoteConfidence,
  ImportBatchStatus,
  ManufacturerProductStatus,
} from "@/generated/prisma/client";

export type StudioNavItem = {
  href: string;
  label: string;
  icon: string;
};

export type DashboardStats = {
  lureModels: number;
  manufacturers: number;
  fishSpecies: number;
  images: number;
  pendingReview: number;
  readyToPublish: number;
  published: number;
  reviewQueue: number;
  pendingImportDiffs: number;
};

export type ImportManufacturerRow = {
  code: string;
  displayName: string;
  status: "active" | "stub";
  lastImport: {
    id: string;
    startedAt: Date;
    durationMs: number | null;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    missingCount: number;
    status: ImportBatchStatus;
    reportPath: string | null;
  } | null;
  productCount: number;
};

export type ProductListRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameTr: string;
  manufacturerName: string;
  manufacturerSlug: string;
  bodyTypeEn: string | null;
  lifecycleState: ContentLifecycleState;
  manufacturerStatus: ManufacturerProductStatus;
  hasEditorNote: boolean;
  updatedAt: Date;
  imageUrl: string | null;
  completenessScore: number;
  completenessMissing: string[];
  trustScore: number;
};

export type ProductListFilters = {
  q?: string;
  manufacturer?: string;
  bodyType?: string;
  lifecycle?: ContentLifecycleState;
  needsReview?: boolean;
  hasEditorNote?: boolean;
  technique?: string;
  species?: string;
  page?: number;
  pageSize?: number;
};

export type ProductEditorData = {
  id: string;
  slug: string;
  nameEn: string;
  nameTr: string;
  lifecycleState: ContentLifecycleState;
  manufacturerStatus: ManufacturerProductStatus;
  formFactorEn: string | null;
  formFactorTr: string | null;
  bodyTypeSlug: string | null;
  bodyTypeEn: string | null;
  bodyTypeTr: string | null;
  coatingTypeSlug: string | null;
  coatingTypeEn: string | null;
  coatingTypeTr: string | null;
  buoyancySlug: string | null;
  buoyancyEn: string | null;
  buoyancyTr: string | null;
  actionSlug: string | null;
  actionEn: string | null;
  actionTr: string | null;
  divingDepthMinM: string | null;
  divingDepthMaxM: string | null;
  trollingSpeedMinKn: string | null;
  trollingSpeedMaxKn: string | null;
  shortDescriptionEn: string | null;
  shortDescriptionTr: string | null;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
  lastImportedAt: Date | null;
  missingImportCount: number;
  manufacturer: {
    id: string;
    slug: string;
    nameEn: string;
    nameTr: string;
    countryCode: string | null;
  };
  productLine: {
    slug: string;
    nameEn: string;
    nameTr: string;
  };
  techniques: { id: string; slug: string; nameEn: string }[];
  species: {
    id: string;
    slug: string;
    nameEn: string;
    associationKind: string;
  }[];
  images: {
    id: string;
    url: string;
    role: string;
    sortOrder: number;
  }[];
  aliases: { alias: string; kind: string }[];
  editorNote: EditorNoteForm | null;
  auditEntries: {
    id: string;
    action: CatalogAuditAction;
    actor: string;
    summary: string;
    createdAt: Date;
  }[];
  pendingImportDiffs: ImportFieldChangeRow[];
  pendingSuggestions: VerificationSuggestionRow[];
  trustProfile: import("@/modules/trust/types").TrustProfile | null;
  completeness: {
    score: number;
    missing: string[];
  };
  manufacturerSourceUrl: string | null;
  canRefreshManufacturer: boolean;
  lastEditorialReviewAt: Date | null;
  changesAvailable: number;
  digitalTwin: {
    manufacturerUrl: string | null;
    lastManufacturerSyncAt: Date | null;
    lastManufacturerCheckAt: Date | null;
    lastSuccessfulImportAt: Date | null;
    syncStatus: string;
    contentHash: string | null;
    manufacturerUpdated: boolean;
    editorialUpdatedAt: Date | null;
  };
};

export type ImportFieldChangeRow = {
  id: string;
  fieldLabel: string;
  fieldKey: string;
  oldValue: string | null;
  newValue: string | null;
  editedValue: string | null;
  changeKind: string;
  status: string;
  createdAt: Date;
};

export type VerificationSuggestionRow = {
  id: string;
  kind: string;
  fieldLabel: string;
  fieldKey: string | null;
  currentValue: string | null;
  suggestedValue: string | null;
  confidence: EditorNoteConfidence;
  source: string;
  reasoning: string | null;
  provenance: Record<string, unknown> | null;
};

export type EditorNoteForm = {
  shortRecommendationEn: string;
  shortRecommendationTr: string;
  longRecommendationEn: string;
  longRecommendationTr: string;
  currentRecommendationEn: string;
  currentRecommendationTr: string;
  mediterraneanNotesEn: string;
  mediterraneanNotesTr: string;
  aegeanNotesEn: string;
  aegeanNotesTr: string;
  northernCyprusNotesEn: string;
  northernCyprusNotesTr: string;
  seasonalityEn: string;
  seasonalityTr: string;
  weatherEn: string;
  weatherTr: string;
  waterClarityEn: string;
  waterClarityTr: string;
  retrieveSpeedEn: string;
  retrieveSpeedTr: string;
  bestTargetSpeciesEn: string;
  bestTargetSpeciesTr: string;
  personalObservationsEn: string;
  personalObservationsTr: string;
  recommendedRetrieveEn: string;
  recommendedRetrieveTr: string;
  warningsEn: string;
  warningsTr: string;
  bestColorsEn: string;
  bestColorsTr: string;
  confidence: EditorNoteConfidence;
  internalNotes: string;
};

export const EMPTY_EDITOR_NOTE: EditorNoteForm = {
  shortRecommendationEn: "",
  shortRecommendationTr: "",
  longRecommendationEn: "",
  longRecommendationTr: "",
  currentRecommendationEn: "",
  currentRecommendationTr: "",
  mediterraneanNotesEn: "",
  mediterraneanNotesTr: "",
  aegeanNotesEn: "",
  aegeanNotesTr: "",
  northernCyprusNotesEn: "",
  northernCyprusNotesTr: "",
  seasonalityEn: "",
  seasonalityTr: "",
  weatherEn: "",
  weatherTr: "",
  waterClarityEn: "",
  waterClarityTr: "",
  retrieveSpeedEn: "",
  retrieveSpeedTr: "",
  bestTargetSpeciesEn: "",
  bestTargetSpeciesTr: "",
  personalObservationsEn: "",
  personalObservationsTr: "",
  recommendedRetrieveEn: "",
  recommendedRetrieveTr: "",
  warningsEn: "",
  warningsTr: "",
  bestColorsEn: "",
  bestColorsTr: "",
  confidence: "MEDIUM",
  internalNotes: "",
};
