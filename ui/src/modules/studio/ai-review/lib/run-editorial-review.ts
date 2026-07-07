import type { StudioReviewEntityType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { detectDuplicates } from "@/modules/studio/ai-review/lib/duplicate-detector";
import { buildMetaSuggestions } from "@/modules/studio/ai-review/lib/build-review-meta";
import { computeScoreBoard } from "@/modules/studio/ai-review/lib/score-board";
import type { ScoreBoard } from "@/modules/studio/ai-review/lib/quality-report";
import { analyzeKnowledgeGraph } from "@/modules/studio/ai-review/graph/knowledge-graph-analyzer";
import {
  createAiReviewSession,
  generateSuggestionsForEntity,
} from "@/modules/studio/ai-review/data/ai-review-repository";
import type { AiSuggestionDraft } from "@/modules/studio/ai-review/types";
import { isMetaSuggestion } from "@/modules/studio/ai-review/lib/quality-report";
import { syncEditorialNotifications } from "@/modules/notification-center/lib/sync-editorial-notifications";
import {
  runEntityValidator,
  runSeedValidator,
} from "@/modules/studio/ai-review/validators/registry";

export type ReviewTrigger =
  | "CREATE"
  | "EDIT"
  | "IMPORT"
  | "MERGE"
  | "PUBLISH"
  | "ARCHIVE"
  | "MANUAL"
  | "BACKGROUND_SCAN";

export type EditorialReviewResult = {
  sessionId: string;
  duplicateCount: number;
  suggestionCount: number;
  readinessScore: number;
  scoreBoard: ScoreBoard;
};

function enrichSuggestion(s: AiSuggestionDraft): AiSuggestionDraft {
  const provenance = s.provenance ?? {};
  return {
    ...s,
    provenance: {
      ...provenance,
      affectedFields: provenance.affectedFields ?? [s.fieldKey],
      impact: provenance.impact ?? (s.confidencePct >= 85 ? "high" : s.confidencePct >= 60 ? "medium" : "low"),
    },
  };
}

async function resolveLifecycleState(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<string | null> {
  switch (entityType) {
    case "SPECIES": {
      const row = await prisma.fishSpecies.findUnique({
        where: { id: entityId },
        select: { profile: { select: { lifecycleState: true } } },
      });
      return row?.profile?.lifecycleState ?? null;
    }
    case "LURE": {
      const row = await prisma.lureModel.findUnique({
        where: { id: entityId },
        select: { lifecycleState: true },
      });
      return row?.lifecycleState ?? null;
    }
    case "CATCH_REPORT": {
      const row = await prisma.catchReport.findUnique({
        where: { id: entityId },
        select: { verificationStatus: true },
      });
      return row?.verificationStatus ?? null;
    }
    default:
      return null;
  }
}

/** Core Editorial Intelligence Engine — no auth; callers supply actor. */
export async function runEditorialReview(input: {
  entityType: StudioReviewEntityType;
  entityId?: string | null;
  seedInput: Record<string, unknown>;
  createdBy: string;
  trigger?: ReviewTrigger;
}): Promise<EditorialReviewResult> {
  const [duplicates, enrichments, entityChecks, graphChecks] = await Promise.all([
    detectDuplicates(input.entityType, input.seedInput),
    generateSuggestionsForEntity(input.entityType, input.seedInput),
    input.entityId
      ? runEntityValidator(input.entityType, input.entityId)
      : Promise.resolve([]),
    input.entityId
      ? analyzeKnowledgeGraph(input.entityType, input.entityId)
      : Promise.resolve([]),
  ]);

  const seedChecks = runSeedValidator(input.entityType, input.seedInput);
  const validationChecks = [
    ...entityChecks,
    ...graphChecks,
    ...seedChecks.filter((c) => c.id === "search"),
  ];

  const suggestions: AiSuggestionDraft[] = enrichments.map(enrichSuggestion);

  if (duplicates.length > 0) {
    suggestions.unshift({
      fieldKey: "duplicateWarning",
      fieldLabel: "Duplicate detection",
      suggestedValue: JSON.stringify(duplicates),
      confidencePct: 99,
      source: "AI_ENRICHMENT",
      reasoning: `Found ${duplicates.length} possible duplicate(s) — review before saving.`,
      provenance: {
        duplicates,
        affectedFields: ["slug", "nameEn", "nameTr", "scientificName"],
        impact: "high",
        trigger: input.trigger,
      },
    });
  }

  suggestions.push(
    ...buildMetaSuggestions(
      validationChecks,
      input.entityId
        ? {
            entityType: input.entityType,
            entityId: input.entityId,
            pendingSuggestions: suggestions.filter((s) => s.fieldKey !== "duplicateWarning").length,
            lifecycleState: await resolveLifecycleState(input.entityType, input.entityId),
          }
        : undefined,
    ),
  );
  const scoreBoard = computeScoreBoard(validationChecks);

  const session = await createAiReviewSession({
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    seedInput: { ...input.seedInput, _trigger: input.trigger ?? "MANUAL" },
    createdBy: input.createdBy,
    suggestions,
  });

  if (input.entityId) {
    await syncEditorialNotifications({
      entityType: input.entityType,
      entityId: input.entityId,
      sessionId: session.id,
      checks: validationChecks,
      suggestions: suggestions.filter((s) => !isMetaSuggestion(s.fieldKey)),
    });
  }

  return {
    sessionId: session.id,
    duplicateCount: duplicates.length,
    suggestionCount: suggestions.length,
    readinessScore: scoreBoard.overall,
    scoreBoard,
  };
}
