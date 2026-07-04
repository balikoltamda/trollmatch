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

export function computeTrustScore(input: {
  lifecycleState: ContentLifecycleState;
  editorConfidence: EditorNoteConfidence | null;
  lastImportedAt: Date | null;
  pendingSuggestions: number;
  hasEditorNote: boolean;
  communityCatchReports: number;
  manufacturerActive: boolean;
}): number {
  let score = 0;

  switch (input.lifecycleState) {
    case "PUBLISHED":
      score += 40;
      break;
    case "READY":
      score += 30;
      break;
    case "PENDING_REVIEW":
      score += 15;
      break;
    default:
      score += 5;
  }

  if (input.editorConfidence === "HIGH") score += 20;
  else if (input.editorConfidence === "MEDIUM") score += 12;
  else if (input.editorConfidence === "LOW") score += 5;

  if (input.lastImportedAt) score += 12;
  if (input.manufacturerActive) score += 8;
  if (input.hasEditorNote) score += 10;
  if (input.pendingSuggestions === 0) score += 10;
  else score -= Math.min(25, input.pendingSuggestions * 4);

  if (input.communityCatchReports >= 10) score += 8;
  else if (input.communityCatchReports >= 3) score += 4;

  return Math.max(0, Math.min(100, score));
}
