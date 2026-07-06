/**
 * Knowledge Pipeline — acquisition architecture subsystem.
 * Sprint 7.4: schema, inbox, graph prep, vision interfaces. No crawlers.
 */

export type {
  KnowledgeInboxItem,
  KnowledgeInboxStats,
} from "@/modules/knowledge-pipeline/types";

export {
  approveKnowledgeItem,
  ignoreKnowledgeItem,
  logOpenKnowledgeSource,
  mergeKnowledgeItems,
  rejectKnowledgeItem,
} from "@/modules/knowledge-pipeline/actions/knowledge-actions";

export {
  getKnowledgeInboxStats,
  listKnowledgeInbox,
} from "@/modules/knowledge-pipeline/data/knowledge-inbox";

export { ensureKnowledgePipelineSeeds } from "@/modules/knowledge-pipeline/data/seed-knowledge";

export {
  GRAPH_ENTITY_LABELS,
  GRAPH_RELATION_LABELS,
} from "@/modules/knowledge-pipeline/lib/knowledge-graph";

export type {
  VisionAnalysisInput,
  VisionAnalysisOutput,
  VisionPipelineService,
} from "@/modules/knowledge-pipeline/lib/vision-pipeline";

export { visionPipelineStub } from "@/modules/knowledge-pipeline/lib/vision-pipeline";
