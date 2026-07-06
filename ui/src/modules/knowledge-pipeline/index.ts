/**
 * Knowledge Pipeline — acquisition + hub subsystem.
 * Sprint 7.5: Knowledge Hub, source scoring, public related knowledge.
 */

export type {
  KnowledgeHubItem,
  KnowledgeHubStats,
  KnowledgeInboxItem,
  KnowledgeInboxStats,
  PublicKnowledgeCard,
  PublicKnowledgeSearchResult,
} from "@/modules/knowledge-pipeline/types";

export {
  KNOWLEDGE_SOURCE_TYPE_LABELS,
} from "@/modules/knowledge-pipeline/types";

export {
  approveKnowledgeItem,
  archiveKnowledgeItem,
  flagKnowledgeOutdated,
  ignoreKnowledgeItem,
  logOpenKnowledgeSource,
  mergeKnowledgeItems,
  rejectKnowledgeItem,
} from "@/modules/knowledge-pipeline/actions/knowledge-actions";

export {
  getKnowledgeHubStats,
  listKnowledgeHub,
  getKnowledgeInboxStats,
  listKnowledgeInbox,
} from "@/modules/knowledge-pipeline/data/knowledge-hub";

export {
  listApprovedKnowledgeForLureSlug,
  listApprovedKnowledgeForSpeciesSlug,
  searchPublicKnowledge,
} from "@/modules/knowledge-pipeline/data/public-knowledge";

export { ensureKnowledgePipelineSeeds } from "@/modules/knowledge-pipeline/data/seed-knowledge";

export {
  GRAPH_ENTITY_LABELS,
  GRAPH_RELATION_LABELS,
} from "@/modules/knowledge-pipeline/lib/knowledge-graph";

export {
  SOURCE_CATEGORY_SCORES,
  SOURCE_SCORE_CATEGORY_LABELS,
  computeSourceScore,
} from "@/modules/knowledge-pipeline/lib/source-scoring";

export type {
  SourceScoreCategory,
  SourceScoreResult,
} from "@/modules/knowledge-pipeline/lib/source-scoring";

export type {
  VisionAnalysisInput,
  VisionAnalysisOutput,
  VisionPipelineService,
} from "@/modules/knowledge-pipeline/lib/vision-pipeline";

export { visionPipelineStub } from "@/modules/knowledge-pipeline/lib/vision-pipeline";
