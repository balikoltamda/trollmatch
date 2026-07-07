"use server";

import { revalidatePath } from "next/cache";
import type { ContentLifecycleState, EditorNoteConfidence, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  auditActor,
  isUnauthorizedResult,
  requireAdminOrUnauthorized,
  requireEditorOrUnauthorized,
} from "@/modules/studio/auth/permissions";
import { recordCatalogAudit } from "@/modules/studio/data/audit";
import {
  deleteMediaAsset,
  setMediaHero,
} from "@/modules/studio/media/actions/media-actions";
import { storeMediaFromUrl } from "@/modules/studio/media/lib/media-storage";
import { findMediaBySha256 } from "@/modules/studio/media/lib/media-queries";
import { hydrateLureModelMediaLocal } from "@/modules/studio/media/lib/media-hydration";
import { probeRemoteImageMetadata } from "@/modules/import/images/remote-image-probe";
import {
  applyAcceptedSyncDiff,
  coerceModelFieldValue,
  isModelFieldKey,
} from "@/modules/import/sync/apply-sync-diff";
import { refreshManufacturerProduct } from "@/modules/import/sync/refresh-manufacturer-product";
import { generateMissingProductContent } from "@/modules/import/sync/content-generator";
import { rebuildCanonicalFromLureModel } from "@/modules/import/enrichment/rebuild-canonical-from-db";
import { isProtectedFieldKey } from "@/modules/import/sync/protected-fields";
import { triggerEditorialReview } from "@/modules/studio/ai-review/lib/trigger-editorial-review";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function requireStudioEditor() {
  return requireEditorOrUnauthorized();
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
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

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
      actor: auditActor(auth),
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
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const hydration = await hydrateLureModelMediaLocal(lureModelId);
    if (hydration.failed > 0) {
      return {
        ok: false,
        error: `Media download failed for ${hydration.failed} image(s): ${hydration.errors.slice(0, 2).join("; ")}`,
      };
    }

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
      actor: auditActor(auth),
      summary: `Published ${model.slug}${hydration.downloaded ? ` (${hydration.downloaded} media cached)` : ""}`,
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
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

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
      actor: auditActor(auth),
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
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const hydration = await hydrateLureModelMediaLocal(lureModelId);
    if (hydration.failed > 0) {
      return {
        ok: false,
        error: `Media download failed for ${hydration.failed} image(s): ${hydration.errors.slice(0, 2).join("; ")}`,
      };
    }

    await prisma.lureModel.update({
      where: { id: lureModelId },
      data: { lifecycleState: "READY" },
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "LIFECYCLE_CHANGE",
      actor: auditActor(auth),
      summary: `Marked product as Ready${hydration.downloaded ? ` (${hydration.downloaded} media cached)` : ""}`,
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

export async function downloadProductMediaNow(
  lureModelId: string,
): Promise<
  | { ok: true; downloaded: number; skipped: number; failed: number }
  | { ok: false; error: string }
> {
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const hydration = await hydrateLureModelMediaLocal(lureModelId);
    if (hydration.failed > 0 && hydration.downloaded === 0) {
      return {
        ok: false,
        error: hydration.errors.slice(0, 3).join("; ") || "Media download failed",
      };
    }

    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "EDITOR_CANONICAL",
      actor: auditActor(auth),
      summary: `Downloaded ${hydration.downloaded} media asset(s) locally`,
      metadata: {
        downloaded: hydration.downloaded,
        skipped: hydration.skipped,
        failed: hydration.failed,
      },
    });

    revalidateProductPaths(lureModelId);
    return {
      ok: true,
      downloaded: hydration.downloaded,
      skipped: hydration.skipped,
      failed: hydration.failed,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Media download failed",
    };
  }
}

async function applyImportDiffDecision(
  diff: {
    id: string;
    lureModelId: string;
    fieldKey: string;
    fieldLabel: string;
    oldValue: string | null;
    newValue: string | null;
    editedValue?: string | null;
  },
  decision: "accept" | "reject",
  manufacturerId: string,
): Promise<void> {
  const appliedValue =
    decision === "accept"
      ? (diff.editedValue?.trim() || diff.newValue)
      : diff.oldValue;

  let persistedImage:
    | {
        url: string;
        sourceUrl: string;
        mimeType?: string | null;
        widthPx?: number | null;
        heightPx?: number | null;
      }
    | null = null;
  if (
    decision === "accept" &&
    diff.fieldKey.startsWith("sync:img:") &&
    appliedValue?.trim()
  ) {
    const remoteUrl = appliedValue.trim();
    const probe = await probeRemoteImageMetadata(remoteUrl);
    persistedImage = {
      url: remoteUrl,
      sourceUrl: remoteUrl,
      mimeType: probe.mimeType,
      widthPx: probe.widthPx,
      heightPx: probe.heightPx,
    };
  }

  await prisma.$transaction(async (tx) => {
    if (decision === "accept" && appliedValue !== null && appliedValue !== undefined) {
      if (isModelFieldKey(diff.fieldKey)) {
        const modelField = diff.fieldKey.replace(/^seo:/, "");
        await tx.lureModel.update({
          where: { id: diff.lureModelId },
          data: {
            [modelField]: coerceModelFieldValue(modelField, appliedValue),
          } as Prisma.LureModelUpdateInput,
        });
      } else {
        await applyAcceptedSyncDiff(tx, {
          fieldKey: diff.fieldKey,
          fieldLabel: diff.fieldLabel,
          newValue: persistedImage?.url ?? appliedValue,
          sourceUrl: persistedImage?.sourceUrl ?? appliedValue,
          mediaAssetId: null,
          mimeType: persistedImage?.mimeType ?? null,
          widthPx: persistedImage?.widthPx ?? null,
          heightPx: persistedImage?.heightPx ?? null,
          lureModelId: diff.lureModelId,
          manufacturerId,
        });
      }
    } else if (decision === "reject" && diff.oldValue !== null && isModelFieldKey(diff.fieldKey)) {
      const modelField = diff.fieldKey.replace(/^seo:/, "");
      await tx.lureModel.update({
        where: { id: diff.lureModelId },
        data: {
          [modelField]: coerceModelFieldValue(modelField, diff.oldValue),
        } as Prisma.LureModelUpdateInput,
      });
    }

    await tx.importFieldChange.update({
      where: { id: diff.id },
      data: {
        status: decision === "accept" ? "ACCEPTED" : "REJECTED",
        resolvedAt: new Date(),
        ...(decision === "accept" && diff.editedValue?.trim()
          ? { editedValue: diff.editedValue.trim() }
          : {}),
      },
    });
  });
}

export async function resolveImportDiff(
  diffId: string,
  decision: "accept" | "reject",
  editedValue?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const diff = await prisma.importFieldChange.findUnique({
      where: { id: diffId },
      include: { lureModel: { select: { manufacturerId: true } } },
    });
    if (!diff || diff.status !== "PENDING") {
      return { ok: false, error: "Diff not found or already resolved" };
    }

    if (
      decision === "accept" &&
      isProtectedFieldKey(diff.fieldKey) &&
      diff.oldValue?.trim()
    ) {
      return {
        ok: false,
        error:
          "This field is editor-protected — use Verify suggestions or edit before accepting.",
      };
    }

    await applyImportDiffDecision(
      { ...diff, editedValue: editedValue ?? null },
      decision,
      diff.lureModel.manufacturerId,
    );

    await recordCatalogAudit({
      lureModelId: diff.lureModelId,
      entityType: "import_diff",
      entityId: diffId,
      action: "IMPORT_DIFF",
      actor: auditActor(auth),
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

export async function resolveAllImportDiffs(
  lureModelId: string,
  decision: "accept" | "reject",
): Promise<{ ok: true; resolved: number } | { ok: false; error: string }> {
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const model = await prisma.lureModel.findFirst({
      where: { id: lureModelId, deletedAt: null },
      select: { manufacturerId: true },
    });
    if (!model) {
      return { ok: false, error: "Product not found" };
    }

    const diffs = await prisma.importFieldChange.findMany({
      where: { lureModelId, status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    if (diffs.length === 0) {
      return { ok: true, resolved: 0 };
    }

    for (const diff of diffs) {
      await applyImportDiffDecision(diff, decision, model.manufacturerId);
    }

    await recordCatalogAudit({
      lureModelId,
      entityType: "import_diff",
      entityId: lureModelId,
      action: "IMPORT_DIFF",
      actor: auditActor(auth),
      summary: `${decision === "accept" ? "Accepted" : "Rejected"} all ${diffs.length} pending import change(s)`,
    });

    revalidateProductPaths(lureModelId);
    return { ok: true, resolved: diffs.length };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Bulk diff resolution failed",
    };
  }
}

export async function refreshManufacturerData(
  lureModelId: string,
): Promise<
  | {
      ok: true;
      diffCount: number;
      filledShortDescription: boolean;
      filledLongDescription: boolean;
      editorialReviewTriggered: boolean;
      sourceUrl: string;
      contentUnchanged: boolean;
      generatedFields: string[];
    }
  | { ok: false; error: string }
> {
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const result = await refreshManufacturerProduct(prisma, lureModelId, {
      actor: auditActor(auth),
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "IMPORT_DIFF",
      actor: auditActor(auth),
      summary: `Refreshed manufacturer data (${result.diffCount} change(s) detected)`,
      metadata: {
        sourceUrl: result.sourceUrl,
        diffCount: result.diffCount,
      },
    });

    revalidateProductPaths(lureModelId);
    return {
      ok: true,
      sourceUrl: result.sourceUrl,
      diffCount: result.diffCount,
      filledShortDescription: result.filledShortDescription,
      filledLongDescription: result.filledLongDescription,
      editorialReviewTriggered: result.editorialReviewTriggered,
      contentUnchanged: result.contentUnchanged,
      generatedFields: result.generatedFields,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Manufacturer refresh failed",
    };
  }
}

export async function runEditorialIntelligence(
  lureModelId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    await triggerEditorialReview("LURE", lureModelId, "EDIT", auditActor(auth));
    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "LIFECYCLE_CHANGE",
      actor: auditActor(auth),
      summary: "Triggered Editorial Intelligence review",
    });
    revalidateProductPaths(lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Editorial review failed",
    };
  }
}

export async function generateMissingProductContentAction(
  lureModelId: string,
): Promise<
  | { ok: true; filledFields: string[] }
  | { ok: false; error: string }
> {
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const canonical = await rebuildCanonicalFromLureModel(prisma, lureModelId);
    if (!canonical) {
      return { ok: false, error: "Product not found" };
    }

    const existing = await prisma.lureModel.findFirst({
      where: { id: lureModelId },
      include: {
        editorNote: {
          select: { longRecommendationEn: true, longRecommendationTr: true },
        },
      },
    });
    if (!existing) {
      return { ok: false, error: "Product not found" };
    }

    const result = await generateMissingProductContent(
      prisma,
      lureModelId,
      canonical,
      existing,
    );

    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "EDITOR_CANONICAL",
      actor: auditActor(auth),
      summary: `Generated missing content (${result.filledFields.length} field(s))`,
      metadata: { filledFields: result.filledFields },
    });

    revalidateProductPaths(lureModelId);
    return { ok: true, filledFields: result.filledFields };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Content generation failed",
    };
  }
}

export async function setCoverImage(
  lureModelId: string,
  imageId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await setMediaHero("lure", imageId);
  if (!result.ok) return result;
  revalidateProductPaths(lureModelId);
  return { ok: true };
}

export async function reorderProductImages(
  lureModelId: string,
  imageIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    await prisma.$transaction(async (tx) => {
      for (const [index, imageId] of imageIds.entries()) {
        await tx.image.update({
          where: { id: imageId, lureModelId },
          data: { sortOrder: index },
        });
      }
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "image",
      entityId: lureModelId,
      action: "EDITOR_CANONICAL",
      actor: auditActor(auth),
      summary: "Reordered product images",
      metadata: { imageIds },
    });

    revalidateProductPaths(lureModelId);
    revalidatePath("/studio/media");
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
  revalidatePath("/studio/media");
}

const RESTORABLE_LIFECYCLE: ContentLifecycleState[] = [
  "ARCHIVED",
  "REJECTED",
  "DEPRECATED",
];

async function setProductLifecycle(
  lureModelId: string,
  lifecycleState: ContentLifecycleState,
  summary: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const model = await prisma.lureModel.update({
      where: { id: lureModelId, deletedAt: null },
      data: { lifecycleState },
      select: { slug: true },
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "LIFECYCLE_CHANGE",
      actor: auditActor(auth),
      summary: `${summary} (${model.slug})`,
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

export async function rejectProduct(
  lureModelId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return setProductLifecycle(lureModelId, "REJECTED", "Rejected product");
}

export async function archiveProduct(
  lureModelId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return setProductLifecycle(lureModelId, "ARCHIVED", "Archived product");
}

export async function restoreProduct(
  lureModelId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const existing = await prisma.lureModel.findFirst({
      where: { id: lureModelId },
      select: { slug: true, deletedAt: true, lifecycleState: true },
    });
    if (!existing) {
      return { ok: false, error: "Product not found" };
    }

    const restoreLifecycle = RESTORABLE_LIFECYCLE.includes(
      existing.lifecycleState,
    )
      ? "PENDING_REVIEW"
      : existing.lifecycleState;

    await prisma.lureModel.update({
      where: { id: lureModelId },
      data: {
        deletedAt: null,
        lifecycleState: restoreLifecycle,
      },
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "LIFECYCLE_CHANGE",
      actor: auditActor(auth),
      summary: `Restored product (${existing.slug})`,
    });

    revalidateProductPaths(lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Restore failed",
    };
  }
}

export async function deleteProduct(
  lureModelId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdminOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const model = await prisma.lureModel.update({
      where: { id: lureModelId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { slug: true },
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "lure_model",
      entityId: lureModelId,
      action: "LIFECYCLE_CHANGE",
      actor: auditActor(auth),
      summary: `Soft-deleted product (${model.slug})`,
    });

    revalidateProductPaths(lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function addProductImageByUrl(
  lureModelId: string,
  url: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

  const trimmed = url.trim();
  if (!isValidHttpUrl(trimmed)) {
    return { ok: false, error: "Enter a valid http(s) image URL" };
  }

  try {
    const stored = await storeMediaFromUrl(trimmed);

    const existing = await prisma.image.findFirst({
      where: {
        lureModelId,
        deletedAt: null,
        OR: [{ url: stored.publicUrl }, { sha256Hash: stored.sha256Hash }],
      },
    });
    if (existing) {
      return { ok: false, error: "This image is already attached to the product" };
    }

    const duplicate = await findMediaBySha256(stored.sha256Hash);

    const maxSort = await prisma.image.aggregate({
      where: { lureModelId, deletedAt: null },
      _max: { sortOrder: true },
    });

    const image = await prisma.image.create({
      data: {
        lureModelId,
        url: stored.publicUrl,
        sourceUrl: stored.sourceUrl,
        sha256Hash: stored.sha256Hash,
        role: "PRODUCT",
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });

    await recordCatalogAudit({
      lureModelId,
      entityType: "image",
      entityId: image.id,
      action: "EDITOR_CANONICAL",
      actor: auditActor(auth),
      summary: "Added product image by URL",
      metadata: {
        url: stored.publicUrl,
        sourceUrl: stored.sourceUrl,
        sha256Hash: stored.sha256Hash,
        duplicateElsewhere: duplicate?.entityName ?? null,
      },
    });

    revalidateProductPaths(lureModelId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function addProductImageByProductSlug(
  productSlug: string,
  url: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const slug = productSlug.trim();
  if (!slug) {
    return { ok: false, error: "Product slug is required" };
  }

  const product = await prisma.lureModel.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  });
  if (!product) {
    return { ok: false, error: "Product not found for that slug" };
  }

  return addProductImageByUrl(product.id, url);
}

export async function deleteProductImage(
  lureModelId: string,
  imageId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await deleteMediaAsset("lure", imageId);
  if (!result.ok) return result;
  revalidateProductPaths(lureModelId);
  return { ok: true };
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
  const auth = await requireStudioEditor();
  if (isUnauthorizedResult(auth)) return auth;

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
      actor: auditActor(auth),
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
