"use server";

import { revalidatePath } from "next/cache";
import type { ContentLifecycleState, EditorNoteConfidence } from "@/generated/prisma/client";
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

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}

export async function saveEditorNotes(
  lureModelId: string,
  data: {
    shortRecommendationEn: string;
    shortRecommendationTr: string;
    longRecommendationEn: string;
    longRecommendationTr: string;
    mediterraneanNotesEn: string;
    mediterraneanNotesTr: string;
    aegeanNotesEn: string;
    aegeanNotesTr: string;
    northernCyprusNotesEn: string;
    northernCyprusNotesTr: string;
    seasonalityEn: string;
    seasonalityTr: string;
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
    const note = await prisma.lureEditorNote.upsert({
      where: { lureModelId },
      create: {
        lureModelId,
        shortRecommendationEn: emptyToNull(data.shortRecommendationEn),
        shortRecommendationTr: emptyToNull(data.shortRecommendationTr),
        longRecommendationEn: emptyToNull(data.longRecommendationEn),
        longRecommendationTr: emptyToNull(data.longRecommendationTr),
        mediterraneanNotesEn: emptyToNull(data.mediterraneanNotesEn),
        mediterraneanNotesTr: emptyToNull(data.mediterraneanNotesTr),
        aegeanNotesEn: emptyToNull(data.aegeanNotesEn),
        aegeanNotesTr: emptyToNull(data.aegeanNotesTr),
        northernCyprusNotesEn: emptyToNull(data.northernCyprusNotesEn),
        northernCyprusNotesTr: emptyToNull(data.northernCyprusNotesTr),
        seasonalityEn: emptyToNull(data.seasonalityEn),
        seasonalityTr: emptyToNull(data.seasonalityTr),
        recommendedRetrieveEn: emptyToNull(data.recommendedRetrieveEn),
        recommendedRetrieveTr: emptyToNull(data.recommendedRetrieveTr),
        warningsEn: emptyToNull(data.warningsEn),
        warningsTr: emptyToNull(data.warningsTr),
        bestColorsEn: emptyToNull(data.bestColorsEn),
        bestColorsTr: emptyToNull(data.bestColorsTr),
        confidence: data.confidence,
        internalNotes: emptyToNull(data.internalNotes),
      },
      update: {
        shortRecommendationEn: emptyToNull(data.shortRecommendationEn),
        shortRecommendationTr: emptyToNull(data.shortRecommendationTr),
        longRecommendationEn: emptyToNull(data.longRecommendationEn),
        longRecommendationTr: emptyToNull(data.longRecommendationTr),
        mediterraneanNotesEn: emptyToNull(data.mediterraneanNotesEn),
        mediterraneanNotesTr: emptyToNull(data.mediterraneanNotesTr),
        aegeanNotesEn: emptyToNull(data.aegeanNotesEn),
        aegeanNotesTr: emptyToNull(data.aegeanNotesTr),
        northernCyprusNotesEn: emptyToNull(data.northernCyprusNotesEn),
        northernCyprusNotesTr: emptyToNull(data.northernCyprusNotesTr),
        seasonalityEn: emptyToNull(data.seasonalityEn),
        seasonalityTr: emptyToNull(data.seasonalityTr),
        recommendedRetrieveEn: emptyToNull(data.recommendedRetrieveEn),
        recommendedRetrieveTr: emptyToNull(data.recommendedRetrieveTr),
        warningsEn: emptyToNull(data.warningsEn),
        warningsTr: emptyToNull(data.warningsTr),
        bestColorsEn: emptyToNull(data.bestColorsEn),
        bestColorsTr: emptyToNull(data.bestColorsTr),
        confidence: data.confidence,
        internalNotes: emptyToNull(data.internalNotes),
      },
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "editor_note",
      entityId: note.id,
      action: "EDITOR_NOTES",
      summary: "Updated Balık Oltamda editor notes",
    });

    revalidatePath(`/studio/products/${lureModelId}`);
    revalidatePath("/studio/notes");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}
