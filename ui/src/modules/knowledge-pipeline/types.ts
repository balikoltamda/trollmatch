/**
 * Knowledge Pipeline — canonical types.
 * Sprint 7.4: architecture + Studio inbox. No crawlers or AI yet.
 */

import type {
  KnowledgeConfidence,
  KnowledgeEditorDecision,
  KnowledgeGraphEntityType,
  KnowledgeGraphRelationKind,
  KnowledgeItemStatus,
  KnowledgeSourceType,
} from "@/generated/prisma/client";

export type {
  KnowledgeConfidence,
  KnowledgeEditorDecision,
  KnowledgeGraphEntityType,
  KnowledgeGraphRelationKind,
  KnowledgeItemStatus,
  KnowledgeSourceType,
};

export type KnowledgeInboxItem = {
  id: string;
  sourceType: KnowledgeSourceType;
  sourceName: { en: string; tr: string };
  sourceSlug: string;
  url: string;
  title: { en: string; tr: string };
  snippet: { en: string; tr: string };
  discoveredAt: Date;
  confidence: KnowledgeConfidence;
  status: KnowledgeItemStatus;
  editorDecision: KnowledgeEditorDecision;
  country: string | null;
  region: string | null;
  relatedSpecies: { slug: string; name: string } | null;
  relatedLure: { slug: string; name: string } | null;
  relatedTechnique: { slug: string; name: string } | null;
  relatedManufacturer: { slug: string; name: string } | null;
  evidenceCount: number;
  suggestionCount: number;
  isDuplicate: boolean;
  hasTaxonomyConflict: boolean;
};

export type KnowledgeInboxStats = {
  pending: number;
  bySourceType: Partial<Record<KnowledgeSourceType, number>>;
};
