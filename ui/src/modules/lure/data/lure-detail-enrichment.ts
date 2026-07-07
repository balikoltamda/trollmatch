import type {
  AiInsight,
  ChangeHistoryEntry,
  RelatedLure,
  SponsoredLink,
} from "@/modules/lure/types/lure-detail";

/**
 * Non-statistic UI placeholders until Sprint 7.7 (AI summaries) and related-lure graph.
 * Community statistics, species, and techniques come from approved catch reports in the DB.
 */
export type LureDetailEnrichment = {
  aiInsights: AiInsight;
  relatedLures: RelatedLure[];
  sponsoredLinks: SponsoredLink[];
  changeHistory: ChangeHistoryEntry[];
};

export function getLureDetailEnrichment(updatedAt: Date): LureDetailEnrichment {
  const empty = { tr: "", en: "" };

  return {
    aiInsights: {
      summary: empty,
      corpusDate: updatedAt.toISOString().slice(0, 10),
      citations: [],
    },
    relatedLures: [],
    sponsoredLinks: [],
    changeHistory: [],
  };
}
