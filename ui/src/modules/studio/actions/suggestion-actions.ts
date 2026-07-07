"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isUnauthorizedResult,
  requireEditorOrUnauthorized,
} from "@/modules/studio/auth/permissions";
import { recordCatalogAudit } from "@/modules/studio/data/audit";
import {
  isEditorNoteFieldKey,
  isModelFieldKey,
} from "@/modules/studio/lib/suggestion-generator";

const DECIMAL_FIELDS = new Set([
  "divingDepthMinM",
  "divingDepthMaxM",
  "trollingSpeedMinKn",
  "trollingSpeedMaxKn",
]);

function parseFieldValue(fieldKey: string, value: string): unknown {
  if (DECIMAL_FIELDS.has(fieldKey)) {
    return new Prisma.Decimal(value);
  }
  return value;
}

async function applySuggestionValue(
  tx: Prisma.TransactionClient,
  lureModelId: string,
  suggestion: {
    kind: string;
    fieldKey: string | null;
    suggestedValue: string | null;
    source?: string;
  },
  value: string,
): Promise<void> {
  if (!suggestion.fieldKey) return;

  switch (suggestion.kind) {
    case "FIELD_VALUE": {
      if (isModelFieldKey(suggestion.fieldKey)) {
        await tx.lureModel.update({
          where: { id: lureModelId },
          data: {
            [suggestion.fieldKey]: parseFieldValue(suggestion.fieldKey, value),
          } as Prisma.LureModelUpdateInput,
        });
      }
      break;
    }
    case "EDITOR_NOTE":
    case "SUMMARY": {
      if (isEditorNoteFieldKey(suggestion.fieldKey)) {
        await tx.lureEditorNote.upsert({
          where: { lureModelId },
          create: {
            lureModelId,
            [suggestion.fieldKey]: value,
          },
          update: {
            [suggestion.fieldKey]: value,
          },
        });
      }
      break;
    }
    case "SPECIES_LINK": {
      const species = await tx.fishSpecies.findFirst({
        where: { slug: suggestion.fieldKey, deletedAt: null },
        select: { id: true },
      });
      if (species) {
        const associationKind =
          suggestion.source === "COMMUNITY_REPORT"
            ? "COMMUNITY_EFFECTIVENESS"
            : "MODERATOR_CURATED";
        await tx.lureSpecies.create({
          data: {
            lureModelId,
            fishSpeciesId: species.id,
            associationKind,
          },
        });
      }
      break;
    }
    case "TECHNIQUE_LINK": {
      const technique = await tx.technique.findFirst({
        where: { slug: suggestion.fieldKey, deletedAt: null },
        select: { id: true },
      });
      if (technique) {
        await tx.lureTechnique.create({
          data: { lureModelId, techniqueId: technique.id },
        });
      }
      break;
    }
    case "IMAGE_COVER": {
      await tx.image.updateMany({
        where: { lureModelId, role: "HERO" },
        data: { role: "PRODUCT" },
      });
      await tx.image.update({
        where: { id: value, lureModelId },
        data: { role: "HERO", sortOrder: 0 },
      });
      break;
    }
    default:
      break;
  }
}

async function resolveLinkedImportDiff(
  tx: Prisma.TransactionClient,
  importFieldChangeId: string | null,
  decision: "accept" | "reject",
): Promise<void> {
  if (!importFieldChangeId) return;
  const diff = await tx.importFieldChange.findUnique({
    where: { id: importFieldChangeId },
  });
  if (!diff || diff.status !== "PENDING") return;

  if (decision === "reject" && diff.oldValue !== null && diff.fieldKey) {
    await tx.lureModel.update({
      where: { id: diff.lureModelId },
      data: {
        [diff.fieldKey]: parseFieldValue(diff.fieldKey, diff.oldValue),
      } as Prisma.LureModelUpdateInput,
    });
  }

  await tx.importFieldChange.update({
    where: { id: importFieldChangeId },
    data: {
      status: decision === "accept" ? "ACCEPTED" : "REJECTED",
      resolvedAt: new Date(),
    },
  });
}

function revalidateStudio(lureModelId: string, slug?: string) {
  revalidatePath("/studio");
  revalidatePath("/studio/review");
  revalidatePath("/studio/community");
  revalidatePath(`/studio/products/${lureModelId}`);
  revalidatePath("/studio/products");
  if (slug) {
    revalidatePath(`/tr/lures/${slug}`);
    revalidatePath(`/en/lures/${slug}`);
  }
}

async function revalidateForProduct(lureModelId: string) {
  const model = await prisma.lureModel.findUnique({
    where: { id: lureModelId },
    select: { slug: true },
  });
  revalidateStudio(lureModelId, model?.slug);
}

export async function approveSuggestion(
  suggestionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const suggestion = await prisma.catalogSuggestion.findUnique({
      where: { id: suggestionId },
    });
    if (!suggestion || suggestion.status !== "PENDING") {
      return { ok: false, error: "Suggestion not found or already resolved" };
    }
    if (!suggestion.suggestedValue) {
      return { ok: false, error: "No suggested value to apply" };
    }

    await prisma.$transaction(async (tx) => {
      await applySuggestionValue(
        tx,
        suggestion.lureModelId,
        suggestion,
        suggestion.suggestedValue!,
      );
      await resolveLinkedImportDiff(
        tx,
        suggestion.importFieldChangeId,
        "accept",
      );
      await tx.catalogSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: "APPROVED",
          resolvedAt: new Date(),
          resolvedBy: "local-admin",
        },
      });
    });

    await recordCatalogAudit({
      lureModelId: suggestion.lureModelId,
      entityType: "suggestion",
      entityId: suggestionId,
      action: "SUGGESTION_APPROVE",
      summary: `Approved suggestion: ${suggestion.fieldLabel}`,
    });

    revalidateForProduct(suggestion.lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Approve failed",
    };
  }
}

export async function rejectSuggestion(
  suggestionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const suggestion = await prisma.catalogSuggestion.findUnique({
      where: { id: suggestionId },
    });
    if (!suggestion || suggestion.status !== "PENDING") {
      return { ok: false, error: "Suggestion not found or already resolved" };
    }

    await prisma.$transaction(async (tx) => {
      await resolveLinkedImportDiff(
        tx,
        suggestion.importFieldChangeId,
        "reject",
      );
      await tx.catalogSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: "REJECTED",
          resolvedAt: new Date(),
          resolvedBy: "local-admin",
        },
      });
    });

    await recordCatalogAudit({
      lureModelId: suggestion.lureModelId,
      entityType: "suggestion",
      entityId: suggestionId,
      action: "SUGGESTION_REJECT",
      summary: `Rejected suggestion: ${suggestion.fieldLabel}`,
    });

    revalidateForProduct(suggestion.lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Reject failed",
    };
  }
}

export async function correctSuggestion(
  suggestionId: string,
  correctedValue: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = correctedValue.trim();
  if (!trimmed) {
    return { ok: false, error: "Corrected value cannot be empty" };
  }

  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const suggestion = await prisma.catalogSuggestion.findUnique({
      where: { id: suggestionId },
    });
    if (!suggestion || suggestion.status !== "PENDING") {
      return { ok: false, error: "Suggestion not found or already resolved" };
    }

    await prisma.$transaction(async (tx) => {
      await applySuggestionValue(tx, suggestion.lureModelId, suggestion, trimmed);
      await resolveLinkedImportDiff(
        tx,
        suggestion.importFieldChangeId,
        "accept",
      );
      await tx.catalogSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: "APPROVED",
          suggestedValue: trimmed,
          resolvedAt: new Date(),
          resolvedBy: "local-admin",
          provenance: {
            ...(typeof suggestion.provenance === "object" && suggestion.provenance
              ? (suggestion.provenance as Record<string, unknown>)
              : {}),
            corrected: true,
          },
        },
      });
    });

    await recordCatalogAudit({
      lureModelId: suggestion.lureModelId,
      entityType: "suggestion",
      entityId: suggestionId,
      action: "SUGGESTION_CORRECT",
      summary: `Corrected and approved: ${suggestion.fieldLabel}`,
      metadata: { correctedValue: trimmed },
    });

    revalidateForProduct(suggestion.lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Correct failed",
    };
  }
}

export async function mergeSuggestions(
  primaryId: string,
  mergeIds: string[],
  mergedValue: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = mergedValue.trim();
  if (!trimmed) {
    return { ok: false, error: "Merged value cannot be empty" };
  }

  const allIds = [primaryId, ...mergeIds.filter((id) => id !== primaryId)];
  if (allIds.length < 2) {
    return { ok: false, error: "Select at least two suggestions to merge" };
  }

  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const suggestions = await prisma.catalogSuggestion.findMany({
      where: { id: { in: allIds }, status: "PENDING" },
    });
    if (suggestions.length < 2) {
      return { ok: false, error: "Pending suggestions not found" };
    }

    const lureModelId = suggestions[0]!.lureModelId;
    if (!suggestions.every((s) => s.lureModelId === lureModelId)) {
      return { ok: false, error: "Suggestions must belong to the same product" };
    }

    const primary = suggestions.find((s) => s.id === primaryId) ?? suggestions[0]!;

    await prisma.$transaction(async (tx) => {
      await applySuggestionValue(tx, lureModelId, primary, trimmed);
      await tx.catalogSuggestion.update({
        where: { id: primary.id },
        data: {
          status: "MERGED",
          suggestedValue: trimmed,
          resolvedAt: new Date(),
          resolvedBy: "local-admin",
        },
      });
      await tx.catalogSuggestion.updateMany({
        where: {
          id: { in: allIds.filter((id) => id !== primary.id) },
        },
        data: {
          status: "SUPERSEDED",
          resolvedAt: new Date(),
          resolvedBy: "local-admin",
        },
      });
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "suggestion",
      entityId: primary.id,
      action: "SUGGESTION_MERGE",
      summary: `Merged ${allIds.length} suggestions for ${primary.fieldLabel}`,
      metadata: { mergedIds: allIds, mergedValue: trimmed },
    });

    revalidateForProduct(lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Merge failed",
    };
  }
}

export async function approveAllSuggestions(
  lureModelId: string,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const pending = await prisma.catalogSuggestion.findMany({
    where: { lureModelId, status: "PENDING" },
    select: { id: true },
  });

  let count = 0;
  for (const { id } of pending) {
    const result = await approveSuggestion(id);
    if (result.ok) count += 1;
  }

  return { ok: true, count };
}
