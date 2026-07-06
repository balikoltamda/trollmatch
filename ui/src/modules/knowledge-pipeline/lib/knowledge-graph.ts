import type {
  KnowledgeGraphEntityType,
  KnowledgeGraphRelationKind,
} from "@/generated/prisma/client";

export type KnowledgeGraphNode = {
  entityType: KnowledgeGraphEntityType;
  entityId: string;
  label?: string;
};

export type KnowledgeGraphEdge = {
  from: KnowledgeGraphNode;
  to: KnowledgeGraphNode;
  relationKind: KnowledgeGraphRelationKind;
  weight?: number;
};

/** Describes a prepared graph edge before persistence. */
export type KnowledgeGraphLinkInput = {
  knowledgeItemId: string;
  entityType: KnowledgeGraphEntityType;
  entityId: string;
  relationKind: KnowledgeGraphRelationKind;
  weight?: number;
};

export const GRAPH_RELATION_LABELS: Record<KnowledgeGraphRelationKind, string> = {
  MENTIONS: "Mentions",
  SUPPORTS: "Supports",
  CONFLICTS_WITH: "Conflicts with",
  DUPLICATE_OF: "Duplicate of",
  RELATED_TO: "Related to",
};

export const GRAPH_ENTITY_LABELS: Record<KnowledgeGraphEntityType, string> = {
  SPECIES: "Species",
  LURE_MODEL: "Lure",
  MANUFACTURER: "Manufacturer",
  TECHNIQUE: "Technique",
  KNOWLEDGE_ITEM: "Knowledge item",
};
