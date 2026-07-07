import type {
  ContentLifecycleState,
  EditorNoteConfidence,
} from "@/generated/prisma/client";
import type { VerificationStatus } from "@/modules/lure/types/lure-detail";

export function derivePublicVerificationStatus(input: {
  lifecycleState: ContentLifecycleState;
  editorConfidence: EditorNoteConfidence | null;
  lastImportedAt: Date | null;
  pendingSuggestions: number;
}): VerificationStatus {
  if (input.lifecycleState === "PUBLISHED") {
    if (input.editorConfidence === "HIGH" && input.pendingSuggestions === 0) {
      return "moderator_verified";
    }
    if (input.editorConfidence === "MEDIUM" || input.pendingSuggestions === 0) {
      return "partially_verified";
    }
    return "partially_verified";
  }

  if (input.lastImportedAt) {
    return "manufacturer_verified";
  }

  return "unverified";
}

export function deriveLastVerifiedAt(input: {
  lifecycleState: ContentLifecycleState;
  publishedAt: Date | null;
  lastImportedAt: Date | null;
  editorNoteUpdatedAt: Date | null;
}): string {
  if (input.lifecycleState === "PUBLISHED" && input.publishedAt) {
    return input.publishedAt.toISOString();
  }
  if (input.editorNoteUpdatedAt) {
    return input.editorNoteUpdatedAt.toISOString();
  }
  if (input.lastImportedAt) {
    return input.lastImportedAt.toISOString();
  }
  return new Date().toISOString();
}

export type TrustScoreInput = {
  lifecycleState: ContentLifecycleState;
  editorConfidence: EditorNoteConfidence | null;
  lastImportedAt: Date | null;
  lastManufacturerSyncAt?: Date | null;
  pendingSuggestions: number;
  hasEditorNote: boolean;
  hasEditorSummary?: boolean;
  communityCatchReports: number;
  manufacturerActive: boolean;
  imageCount?: number;
  technologyCount?: number;
  hasCompleteSpecs?: boolean;
  hasShortDescriptionEn?: boolean;
  hasShortDescriptionTr?: boolean;
  knowledgeSourceCount?: number;
};

/** Category-based trust score — expandable breakdown per sprint 7.8 spec. */
export function computeTrustScore(input: TrustScoreInput): number {
  const breakdown = buildTrustScoreBreakdown(input);
  const total = breakdown.reduce((sum, factor) => sum + factor.delta, 0);
  return Math.max(0, Math.min(100, total));
}

export type TrustScoreBreakdownInput = TrustScoreInput;

export function buildTrustScoreBreakdown(
  input: TrustScoreBreakdownInput,
): import("@/modules/trust/types").TrustScoreFactor[] {
  const factors: import("@/modules/trust/types").TrustScoreFactor[] = [];

  if (input.lastImportedAt || input.lastManufacturerSyncAt) {
    factors.push({
      label: "Manufacturer data verified",
      delta: 25,
      tone: "positive",
      category: "Manufacturer Data",
    });
  } else {
    factors.push({
      label: "Not confirmed against manufacturer feed",
      delta: 0,
      tone: "negative",
      category: "Manufacturer Data",
    });
  }

  if (input.hasCompleteSpecs) {
    factors.push({
      label: "Complete specifications",
      delta: 20,
      tone: "positive",
      category: "Specifications",
    });
  } else {
    factors.push({
      label: "Incomplete specifications",
      delta: 0,
      tone: "negative",
      category: "Specifications",
    });
  }

  if ((input.imageCount ?? 0) > 0) {
    factors.push({
      label: "Product images on file",
      delta: 15,
      tone: "positive",
      category: "Images",
    });
  } else {
    factors.push({
      label: "Missing product images",
      delta: 0,
      tone: "negative",
      category: "Images",
    });
  }

  if ((input.technologyCount ?? 0) > 0) {
    factors.push({
      label: "Manufacturer technologies linked",
      delta: 15,
      tone: "positive",
      category: "Technologies",
    });
  } else {
    factors.push({
      label: "No technologies linked",
      delta: 0,
      tone: "negative",
      category: "Technologies",
    });
  }

  if (
    input.lifecycleState === "PUBLISHED" ||
    input.lifecycleState === "READY"
  ) {
    factors.push({
      label: "Editorial review complete",
      delta: 10,
      tone: "positive",
      category: "Editorial Review",
    });
  } else {
    factors.push({
      label: "Pending editorial review",
      delta: 0,
      tone: "neutral",
      category: "Editorial Review",
    });
  }

  if ((input.knowledgeSourceCount ?? 0) > 0) {
    factors.push({
      label: "Knowledge sources linked",
      delta: 10,
      tone: "positive",
      category: "Knowledge Sources",
    });
  }

  if (input.communityCatchReports >= 3) {
    factors.push({
      label: "Verified catch reports",
      delta: 5,
      tone: "positive",
      category: "Catch Reports",
    });
  } else {
    factors.push({
      label: "Missing catch reports",
      delta: 0,
      tone: "negative",
      category: "Catch Reports",
    });
  }

  if (!input.hasShortDescriptionEn) {
    factors.push({
      label: "Missing English summary",
      delta: -5,
      tone: "negative",
      category: "Content",
    });
  }

  if (!input.hasEditorSummary) {
    factors.push({
      label: "No editor summary",
      delta: -3,
      tone: "negative",
      category: "Content",
    });
  }

  if (input.pendingSuggestions > 0) {
    factors.push({
      label: `${input.pendingSuggestions} pending suggestion(s)`,
      delta: -Math.min(15, input.pendingSuggestions * 3),
      tone: "negative",
      category: "Review",
    });
  }

  return factors;
}
