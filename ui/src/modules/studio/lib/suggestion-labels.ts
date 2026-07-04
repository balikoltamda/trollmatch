import type { SuggestionSource, SuggestionStatus } from "@/generated/prisma/client";

export const SOURCE_LABELS: Record<SuggestionSource, string> = {
  IMPORTER: "Importer",
  AI_ENRICHMENT: "AI enrichment",
  COMMUNITY_REPORT: "Community report",
  AI_SUMMARY: "AI summary",
  EDITOR: "Editor",
};

export const STATUS_LABELS: Record<SuggestionStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  MERGED: "Merged",
  SUPERSEDED: "Superseded",
};
