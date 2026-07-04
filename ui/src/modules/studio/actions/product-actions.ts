"use server";

import { revalidatePath } from "next/cache";
import type { ContentLifecycleState, EditorNoteConfidence, Prisma } from "@/generated/prisma/client";
import { Prisma as PrismaRuntime } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { recordCatalogAudit } from "@/modules/studio/data/audit";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveCanonicalProduct(
  lureModelId: string,
  data: {
    nameEn: string;
    nameTr: string;
    slug: string;
    lifecycleState: ContentLifecycleState;
    bodyTypeEn: string;
    bodyTypeTr: string;
    coatingTypeEn: string;
    coatingTypeTr: string;
    buoyancyEn: string;
    buoyancyTr: string;
    actionEn: string;
    actionTr: string;
    divingDepthMinM: string;
    divingDepthMaxM: string;
    trollingSpeedMinKn: string;
    trollingSpeedMaxKn: string;
    techniqueIds: string[];
    speciesIds: string[];
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.lureModel.update({
        where: { id: lureModelId },
        data: {
          nameEn: data.nameEn.trim(),
          nameTr: data.nameTr.trim(),
          slug: data.slug.trim(),
          lifecycleState: data.lifecycleState,
          bodyTypeEn: emptyToNull(data.bodyTypeEn),
          bodyTypeTr: emptyToNull(data.bodyTypeTr),
          coatingTypeEn: emptyToNull(data.coatingTypeEn),
          coatingTypeTr: emptyToNull(data.coatingTypeTr),
          buoyancyEn: emptyToNull(data.buoyancyEn),
          buoyancyTr: emptyToNull(data.buoyancyTr),
          actionEn: emptyToNull(data.actionEn),
          actionTr: emptyToNull(data.actionTr),
          divingDepthMinM: emptyToNull(data.divingDepthMinM),
          divingDepthMaxM: emptyToNull(data.divingDepthMaxM),
          trollingSpeedMinKn: emptyToNull(data.trollingSpeedMinKn),
          trollingSpeedMaxKn: emptyToNull(data.trollingSpeedMaxKn),
        },
      });

      await tx.lureTechnique.deleteMany({ where: { lureModelId } });
      if (data.techniqueIds.length > 0) {
        await tx.lureTechnique.createMany({
          data: data.techniqueIds.map((techniqueId) => ({
            lureModelId,
            techniqueId,
          })),
          skipDuplicates: true,
        });
      }

      await tx.lureSpecies.deleteMany({
        where: { lureModelId, associationKind: "MODERATOR_CURATED" },
      });
      if (data.speciesIds.length > 0) {
        await tx.lureSpecies.createMany({
          data: data.speciesIds.map((fishSpeciesId) => ({
            lureModelId,
            fishSpeciesId,
            associationKind: "MODERATOR_CURATED" as const,
          })),
          skipDuplicates: true,
        });
      }
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "EDITOR_CANONICAL",
      summary: `Updated canonical fields for ${data.slug}`,
    });

    revalidatePath(`/studio/products/${lureModelId}`);
    revalidatePath("/studio/products");
    revalidatePath("/studio");
    revalidatePath("/studio/review");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}

export async function publishProduct(
  lureModelId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const model = await prisma.lureModel.update({
      where: { id: lureModelId },
      data: { lifecycleState: "PUBLISHED" },
      select: { slug: true },
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "PUBLISH",
      summary: `Published ${model.slug}`,
    });

    revalidateProductPaths(lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Publish failed",
    };
  }
}

export async function unpublishProduct(
  lureModelId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const model = await prisma.lureModel.update({
      where: { id: lureModelId },
      data: { lifecycleState: "READY" },
      select: { slug: true },
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "UNPUBLISH",
      summary: `Unpublished ${model.slug}`,
    });

    revalidateProductPaths(lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unpublish failed",
    };
  }
}

export async function markProductReady(
  lureModelId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.lureModel.update({
      where: { id: lureModelId },
      data: { lifecycleState: "READY" },
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "LIFECYCLE_CHANGE",
      summary: "Marked product as Ready",
    });

    revalidateProductPaths(lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

export async function resolveImportDiff(
  diffId: string,
  decision: "accept" | "reject",
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const diff = await prisma.importFieldChange.findUnique({
      where: { id: diffId },
    });
    if (!diff || diff.status !== "PENDING") {
      return { ok: false, error: "Diff not found or already resolved" };
    }

    await prisma.$transaction(async (tx) => {
      if (decision === "reject" && diff.oldValue !== null) {
        const DECIMAL_FIELDS = new Set([
          "divingDepthMinM",
          "divingDepthMaxM",
          "trollingSpeedMinKn",
          "trollingSpeedMaxKn",
        ]);
        const revertValue = DECIMAL_FIELDS.has(diff.fieldKey)
          ? new PrismaRuntime.Decimal(diff.oldValue)
          : diff.oldValue;
        await tx.lureModel.update({
          where: { id: diff.lureModelId },
          data: { [diff.fieldKey]: revertValue } as Prisma.LureModelUpdateInput,
        });
      }

      await tx.importFieldChange.update({
        where: { id: diffId },
        data: {
          status: decision === "accept" ? "ACCEPTED" : "REJECTED",
          resolvedAt: new Date(),
        },
      });
    });

    await recordCatalogAudit({
      lureModelId: diff.lureModelId,
      entityType: "import_diff",
      entityId: diffId,
      action: "IMPORT_DIFF",
      summary: `${decision === "accept" ? "Accepted" : "Rejected"} import change: ${diff.fieldLabel}`,
    });

    revalidateProductPaths(diff.lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Diff resolution failed",
    };
  }
}

export async function setCoverImage(
  lureModelId: string,
  imageId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.image.updateMany({
        where: { lureModelId, role: "HERO" },
        data: { role: "PRODUCT" },
      });
      await tx.image.update({
        where: { id: imageId, lureModelId },
        data: { role: "HERO", sortOrder: 0 },
      });
    });

    revalidateProductPaths(lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Cover update failed",
    };
  }
}

export async function reorderProductImages(
  lureModelId: string,
  imageIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const [index, imageId] of imageIds.entries()) {
        await tx.image.update({
          where: { id: imageId, lureModelId },
          data: { sortOrder: index },
        });
      }
    });

    revalidateProductPaths(lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Reorder failed",
    };
  }
}

function editorNotePayload(data: {
  shortRecommendationEn: string;
  shortRecommendationTr: string;
  longRecommendationEn: string;
  longRecommendationTr: string;
  currentRecommendationEn: string;
  currentRecommendationTr: string;
  mediterraneanNotesEn: string;
  mediterraneanNotesTr: string;
  aegeanNotesEn: string;
  aegeanNotesTr: string;
  northernCyprusNotesEn: string;
  northernCyprusNotesTr: string;
  seasonalityEn: string;
  seasonalityTr: string;
  weatherEn: string;
  weatherTr: string;
  waterClarityEn: string;
  waterClarityTr: string;
  retrieveSpeedEn: string;
  retrieveSpeedTr: string;
  bestTargetSpeciesEn: string;
  bestTargetSpeciesTr: string;
  personalObservationsEn: string;
  personalObservationsTr: string;
  recommendedRetrieveEn: string;
  recommendedRetrieveTr: string;
  warningsEn: string;
  warningsTr: string;
  bestColorsEn: string;
  bestColorsTr: string;
  confidence: EditorNoteConfidence;
  internalNotes: string;
}) {
  return {
    shortRecommendationEn: emptyToNull(data.shortRecommendationEn),
    shortRecommendationTr: emptyToNull(data.shortRecommendationTr),
    longRecommendationEn: emptyToNull(data.longRecommendationEn),
    longRecommendationTr: emptyToNull(data.longRecommendationTr),
    currentRecommendationEn: emptyToNull(data.currentRecommendationEn),
    currentRecommendationTr: emptyToNull(data.currentRecommendationTr),
    mediterraneanNotesEn: emptyToNull(data.mediterraneanNotesEn),
    mediterraneanNotesTr: emptyToNull(data.mediterraneanNotesTr),
    aegeanNotesEn: emptyToNull(data.aegeanNotesEn),
    aegeanNotesTr: emptyToNull(data.aegeanNotesTr),
    northernCyprusNotesEn: emptyToNull(data.northernCyprusNotesEn),
    northernCyprusNotesTr: emptyToNull(data.northernCyprusNotesTr),
    seasonalityEn: emptyToNull(data.seasonalityEn),
    seasonalityTr: emptyToNull(data.seasonalityTr),
    weatherEn: emptyToNull(data.weatherEn),
    weatherTr: emptyToNull(data.weatherTr),
    waterClarityEn: emptyToNull(data.waterClarityEn),
    waterClarityTr: emptyToNull(data.waterClarityTr),
    retrieveSpeedEn: emptyToNull(data.retrieveSpeedEn),
    retrieveSpeedTr: emptyToNull(data.retrieveSpeedTr),
    bestTargetSpeciesEn: emptyToNull(data.bestTargetSpeciesEn),
    bestTargetSpeciesTr: emptyToNull(data.bestTargetSpeciesTr),
    personalObservationsEn: emptyToNull(data.personalObservationsEn),
    personalObservationsTr: emptyToNull(data.personalObservationsTr),
    recommendedRetrieveEn: emptyToNull(data.recommendedRetrieveEn),
    recommendedRetrieveTr: emptyToNull(data.recommendedRetrieveTr),
    warningsEn: emptyToNull(data.warningsEn),
    warningsTr: emptyToNull(data.warningsTr),
    bestColorsEn: emptyToNull(data.bestColorsEn),
    bestColorsTr: emptyToNull(data.bestColorsTr),
    confidence: data.confidence,
    internalNotes: emptyToNull(data.internalNotes),
  };
}

function revalidateProductPaths(lureModelId: string) {
  revalidatePath(`/studio/products/${lureModelId}`);
  revalidatePath("/studio/products");
  revalidatePath("/studio/review");
  revalidatePath("/studio");
}

export async function saveEditorNotes(
  lureModelId: string,
  data: {
    shortRecommendationEn: string;
    shortRecommendationTr: string;
    longRecommendationEn: string;
    longRecommendationTr: string;
    currentRecommendationEn: string;
    currentRecommendationTr: string;
    mediterraneanNotesEn: string;
    mediterraneanNotesTr: string;
    aegeanNotesEn: string;
    aegeanNotesTr: string;
    northernCyprusNotesEn: string;
    northernCyprusNotesTr: string;
    seasonalityEn: string;
    seasonalityTr: string;
    weatherEn: string;
    weatherTr: string;
    waterClarityEn: string;
    waterClarityTr: string;
    retrieveSpeedEn: string;
    retrieveSpeedTr: string;
    bestTargetSpeciesEn: string;
    bestTargetSpeciesTr: string;
    personalObservationsEn: string;
    personalObservationsTr: string;
    recommendedRetrieveEn: string;
    recommendedRetrieveTr: string;
    warningsEn: string;
    warningsTr: string;
    bestColorsEn: string;
    bestColorsTr: string;
    confidence: EditorNoteConfidence;
    internalNotes: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const payload = editorNotePayload(data);
    const note = await prisma.lureEditorNote.upsert({
      where: { lureModelId },
      create: { lureModelId, ...payload },
      update: payload,
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "editor_note",
      entityId: note.id,
      action: "EDITOR_NOTES",
      summary: "Updated Balık Oltamda editor notes",
    });

    revalidateProductPaths(lureModelId);
    revalidatePath("/studio/notes");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}
