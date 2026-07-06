/**
 * Knowledge Pipeline — canonical types.
 * Sprint 7.5: Knowledge Hub + source intelligence. Index, not mirror.
 */

import type {
  KnowledgeConfidence,
  KnowledgeEditorDecision,
  KnowledgeGraphEntityType,
  KnowledgeGraphRelationKind,
  KnowledgeItemStatus,
  KnowledgeSourceType,
} from "@/generated/prisma/client";
import type { SourceScoreCategory } from "@/modules/knowledge-pipeline/lib/source-scoring";

export type {
  KnowledgeConfidence,
  KnowledgeEditorDecision,
  KnowledgeGraphEntityType,
  KnowledgeGraphRelationKind,
  KnowledgeItemStatus,
  KnowledgeSourceType,
};

export type KnowledgeEntityRef = {
  slug: string;
  name: { en: string; tr: string };
};

export type KnowledgeHubItem = {
  id: string;
  sourceType: KnowledgeSourceType;
  sourceName: { en: string; tr: string };
  sourceSlug: string;
  url: string;
  title: { en: string; tr: string };
  language: string | null;
  aiSummary: { en: string; tr: string } | null;
  sourcePreview: { en: string; tr: string } | null;
  discoveredAt: Date;
  confidence: KnowledgeConfidence;
  status: KnowledgeItemStatus;
  editorDecision: KnowledgeEditorDecision;
  country: string | null;
  region: string | null;
  relatedSpecies: KnowledgeEntityRef[];
  relatedLures: KnowledgeEntityRef[];
  relatedTechniques: KnowledgeEntityRef[];
  relatedManufacturers: KnowledgeEntityRef[];
  sourceScore: number;
  sourceScoreCategory: SourceScoreCategory;
  sourceScoreCategoryLabel: string;
  evidenceCount: number;
  suggestionCount: number;
  isDuplicate: boolean;
  hasTaxonomyConflict: boolean;
};

/** @deprecated Use KnowledgeHubItem — kept for backward compat during 7.5 transition. */
export type KnowledgeInboxItem = KnowledgeHubItem;

export type KnowledgeHubStats = {
  pending: number;
  approved: number;
  archived: number;
  outdated: number;
  bySourceType: Partial<Record<KnowledgeSourceType, number>>;
};

/** @deprecated Use KnowledgeHubStats */
export type KnowledgeInboxStats = KnowledgeHubStats;

export type PublicKnowledgeCard = {
  id: string;
  url: string;
  title: { en: string; tr: string };
  aiSummary: { en: string; tr: string } | null;
  sourceType: KnowledgeSourceType;
  sourceName: { en: string; tr: string };
  sourceScore: number;
  region: string | null;
  country: string | null;
};

export type PublicKnowledgeSearchResult = {
  query: string | null;
  rows: PublicKnowledgeCard[];
  total: number;
  page: number;
  pageSize: number;
};

export const KNOWLEDGE_SOURCE_TYPE_LABELS: Record<KnowledgeSourceType, { en: string; tr: string }> = {
  MANUFACTURER: { en: "Manufacturer", tr: "Üretici" },
  YOUTUBE: { en: "YouTube video", tr: "YouTube videosu" },
  FISHING_FORUM: { en: "Forum discussion", tr: "Forum tartışması" },
  FISHING_BLOG: { en: "Blog article", tr: "Blog yazısı" },
  PUBLIC_ARTICLE: { en: "Article", tr: "Makale" },
  MAGAZINE: { en: "Magazine", tr: "Dergi" },
  SCIENTIFIC_PUBLICATION: { en: "Scientific paper", tr: "Bilimsel yayın" },
  COMMUNITY: { en: "Community", tr: "Topluluk" },
  OTHER: { en: "Other", tr: "Diğer" },
};
