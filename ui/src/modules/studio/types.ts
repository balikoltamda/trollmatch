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
};

export type ProductListFilters = {
  q?: string;
  manufacturer?: string;
  bodyType?: string;
  lifecycle?: ContentLifecycleState;
  needsReview?: boolean;
  hasEditorNote?: boolean;
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
};

export type EditorNoteForm = {
  shortRecommendationEn: string;
  shortRecommendationTr: string;
  longRecommendationEn: string;
  longRecommendationTr: string;
  mediterraneanNotesEn: string;
  mediterraneanNotesTr: string;
  aegeanNotesEn: string;
  aegeanNotesTr: string;
  northernCyprusNotesEn: string;
  northernCyprusNotesTr: string;
  seasonalityEn: string;
  seasonalityTr: string;
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
  mediterraneanNotesEn: "",
  mediterraneanNotesTr: "",
  aegeanNotesEn: "",
  aegeanNotesTr: "",
  northernCyprusNotesEn: "",
  northernCyprusNotesTr: "",
  seasonalityEn: "",
  seasonalityTr: "",
  recommendedRetrieveEn: "",
  recommendedRetrieveTr: "",
  warningsEn: "",
  warningsTr: "",
  bestColorsEn: "",
  bestColorsTr: "",
  confidence: "MEDIUM",
  internalNotes: "",
};
