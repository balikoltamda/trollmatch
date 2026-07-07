import type { StudioReviewEntityType } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeSpeciesSeed } from "@/modules/studio/ai-review/analyzers/species-analyzer";
import { analyzeTechniqueSeed } from "@/modules/studio/ai-review/analyzers/technique-analyzer";
import {
  analyzeCatchReportSeed,
  analyzeKnowledgeSourceSeed,
  analyzeLureSeed,
  analyzeManufacturerSeed,
  analyzeRegionSeed,
} from "@/modules/studio/ai-review/analyzers/generic-analyzer";
import type {
  AiReviewSessionView,
  AiSuggestionDraft,
  AiSuggestionView,
} from "@/modules/studio/ai-review/types";

function mapSuggestion(row: {
  id: string;
  sessionId: string;
  entityType: StudioReviewEntityType;
  entityId: string | null;
  fieldKey: string;
  fieldLabel: string;
  suggestedValue: string;
  currentValue: string | null;
  confidencePct: number;
  source: AiSuggestionView["source"];
  reasoning: string;
  status: AiSuggestionView["status"];
  editedValue: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  provenance: unknown;
}): AiSuggestionView {
  return {
    id: row.id,
    sessionId: row.sessionId,
    entityType: row.entityType,
    entityId: row.entityId,
    fieldKey: row.fieldKey,
    fieldLabel: row.fieldLabel,
    suggestedValue: row.suggestedValue,
    currentValue: row.currentValue,
    confidencePct: row.confidencePct,
    source: row.source,
    reasoning: row.reasoning,
    status: row.status,
    editedValue: row.editedValue,
    resolvedAt: row.resolvedAt,
    resolvedBy: row.resolvedBy,
    provenance: (row.provenance as Record<string, unknown> | null) ?? null,
  };
}

export async function generateSuggestionsForEntity(
  entityType: StudioReviewEntityType,
  seedInput: Record<string, unknown>,
): Promise<AiSuggestionDraft[]> {
  switch (entityType) {
    case "SPECIES":
      return analyzeSpeciesSeed(seedInput as { nameTr?: string; nameEn?: string; scientificName?: string });
    case "TECHNIQUE":
      return analyzeTechniqueSeed(seedInput as { nameTr?: string; nameEn?: string });
    case "MANUFACTURER":
      return analyzeManufacturerSeed(seedInput as { nameEn?: string; nameTr?: string });
    case "LURE":
      return analyzeLureSeed(
        seedInput as {
          nameEn?: string;
          nameTr?: string;
          manufacturerSlug?: string;
          shortDescriptionEn?: string | null;
          shortDescriptionTr?: string | null;
          divingDepthMinM?: number | null;
          divingDepthMaxM?: number | null;
          buoyancySlug?: string | null;
          actionSlug?: string | null;
          primaryLengthMm?: number | null;
          primaryWeightG?: number | null;
          techniqueSlugs?: string[];
          speciesSlugs?: string[];
          technologySlugs?: string[];
          imageCount?: number;
          hasHeroImage?: boolean;
          bodyTypeSlug?: string | null;
          editorialRelationshipHints?: {
            techniques?: string[];
            lureCategories?: string[];
            species?: string[];
            regions?: string[];
            waterTypes?: string[];
            seasons?: string[];
          };
        },
      );
    case "KNOWLEDGE_SOURCE":
      return analyzeKnowledgeSourceSeed(seedInput as { title?: string; url?: string });
    case "REGION":
      return analyzeRegionSeed(seedInput as { nameEn?: string; nameTr?: string; code?: string });
    case "CATCH_REPORT":
      return analyzeCatchReportSeed(seedInput as { reportId?: string; techniqueId?: string });
    case "LURE_VARIANT":
    case "PRODUCT_LINE":
      return [];
    default:
      return [];
  }
}

export async function createAiReviewSession(input: {
  entityType: StudioReviewEntityType;
  entityId?: string | null;
  seedInput: Record<string, unknown>;
  createdBy: string;
  suggestions: AiSuggestionDraft[];
}): Promise<AiReviewSessionView> {
  const session = await prisma.studioAiReviewSession.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      seedInput: input.seedInput as Prisma.InputJsonValue,
      createdBy: input.createdBy,
      suggestions: {
        create: input.suggestions.map((s) => ({
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          fieldKey: s.fieldKey,
          fieldLabel: s.fieldLabel,
          suggestedValue: s.suggestedValue,
          currentValue: s.currentValue ?? null,
          confidencePct: s.confidencePct,
          source: s.source,
          reasoning: s.reasoning,
          provenance: (s.provenance ?? undefined) as Prisma.InputJsonValue | undefined,
        })),
      },
    },
    include: { suggestions: { orderBy: { confidencePct: "desc" } } },
  });

  return {
    id: session.id,
    entityType: session.entityType,
    entityId: session.entityId,
    seedInput: session.seedInput as Record<string, unknown>,
    createdAt: session.createdAt,
    suggestions: session.suggestions.map(mapSuggestion),
  };
}

export async function getLatestAiReviewSession(input: {
  entityType: StudioReviewEntityType;
  entityId?: string | null;
  sessionId?: string;
}): Promise<AiReviewSessionView | null> {
  const session = input.sessionId
    ? await prisma.studioAiReviewSession.findUnique({
        where: { id: input.sessionId },
        include: { suggestions: { orderBy: { confidencePct: "desc" } } },
      })
    : await prisma.studioAiReviewSession.findFirst({
        where: {
          entityType: input.entityType,
          entityId: input.entityId ?? null,
        },
        orderBy: { createdAt: "desc" },
        include: { suggestions: { orderBy: { confidencePct: "desc" } } },
      });

  if (!session) return null;

  return {
    id: session.id,
    entityType: session.entityType,
    entityId: session.entityId,
    seedInput: session.seedInput as Record<string, unknown>,
    createdAt: session.createdAt,
    suggestions: session.suggestions.map(mapSuggestion),
  };
}

export async function getSuggestionById(id: string) {
  return prisma.studioAiSuggestion.findUnique({ where: { id } });
}
