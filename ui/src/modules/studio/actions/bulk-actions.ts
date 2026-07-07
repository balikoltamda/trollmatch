"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  auditActor,
  isUnauthorizedResult,
  requireAdminOrUnauthorized,
  requireEditorOrUnauthorized,
} from "@/modules/studio/auth/permissions";
import { recordCatalogAudit } from "@/modules/studio/data/audit";
import { exportProductsCsv } from "@/modules/studio/data/products";

export type BulkAction =
  | "publish"
  | "unpublish"
  | "reject"
  | "archive"
  | "restore"
  | "delete"
  | "assign_species"
  | "assign_techniques"
  | "delete_editor_note"
  | "export";

export async function bulkProductAction(
  ids: string[],
  action: BulkAction,
  payload?: { speciesIds?: string[]; techniqueIds?: string[] },
): Promise<
  | { ok: true; message: string; csv?: string }
  | { ok: false; error: string }
> {
  if (ids.length === 0) {
    return { ok: false, error: "No products selected" };
  }

  try {
    switch (action) {
      case "publish": {
        const actor = await requireEditorOrUnauthorized();
        if (isUnauthorizedResult(actor)) return actor;
        await prisma.lureModel.updateMany({
          where: { id: { in: ids }, deletedAt: null },
          data: { lifecycleState: "PUBLISHED" },
        });
        await recordCatalogAudit({
          entityType: "bulk",
          entityId: ids[0]!,
          action: "BULK_ACTION",
          actor: auditActor(actor),
          summary: `Published ${ids.length} products`,
          metadata: { ids, action },
        });
        revalidateStudio();
        return { ok: true, message: `Published ${ids.length} products` };
      }

      case "unpublish": {
        const actor = await requireEditorOrUnauthorized();
        if (isUnauthorizedResult(actor)) return actor;
        await prisma.lureModel.updateMany({
          where: { id: { in: ids }, deletedAt: null },
          data: { lifecycleState: "READY" },
        });
        await recordCatalogAudit({
          entityType: "bulk",
          entityId: ids[0]!,
          action: "BULK_ACTION",
          actor: auditActor(actor),
          summary: `Unpublished ${ids.length} products`,
          metadata: { ids, action },
        });
        revalidateStudio();
        return { ok: true, message: `Unpublished ${ids.length} products` };
      }

      case "reject": {
        const actor = await requireEditorOrUnauthorized();
        if (isUnauthorizedResult(actor)) return actor;
        await prisma.lureModel.updateMany({
          where: { id: { in: ids }, deletedAt: null },
          data: { lifecycleState: "REJECTED" },
        });
        await recordCatalogAudit({
          entityType: "bulk",
          entityId: ids[0]!,
          action: "BULK_ACTION",
          actor: auditActor(actor),
          summary: `Rejected ${ids.length} products`,
          metadata: { ids, action },
        });
        revalidateStudio();
        return { ok: true, message: `Rejected ${ids.length} products` };
      }

      case "archive": {
        const actor = await requireEditorOrUnauthorized();
        if (isUnauthorizedResult(actor)) return actor;
        await prisma.lureModel.updateMany({
          where: { id: { in: ids }, deletedAt: null },
          data: { lifecycleState: "ARCHIVED" },
        });
        await recordCatalogAudit({
          entityType: "bulk",
          entityId: ids[0]!,
          action: "BULK_ACTION",
          actor: auditActor(actor),
          summary: `Archived ${ids.length} products`,
          metadata: { ids, action },
        });
        revalidateStudio();
        return { ok: true, message: `Archived ${ids.length} products` };
      }

      case "restore": {
        const actor = await requireEditorOrUnauthorized();
        if (isUnauthorizedResult(actor)) return actor;
        await prisma.lureModel.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: null, lifecycleState: "PENDING_REVIEW" },
        });
        await recordCatalogAudit({
          entityType: "bulk",
          entityId: ids[0]!,
          action: "BULK_ACTION",
          actor: auditActor(actor),
          summary: `Restored ${ids.length} products`,
          metadata: { ids, action },
        });
        revalidateStudio();
        return { ok: true, message: `Restored ${ids.length} products` };
      }

      case "delete": {
        const actor = await requireAdminOrUnauthorized();
        if (isUnauthorizedResult(actor)) return actor;
        await prisma.lureModel.updateMany({
          where: { id: { in: ids }, deletedAt: null },
          data: { deletedAt: new Date() },
        });
        await recordCatalogAudit({
          entityType: "bulk",
          entityId: ids[0]!,
          action: "BULK_ACTION",
          actor: auditActor(actor),
          summary: `Soft-deleted ${ids.length} products`,
          metadata: { ids, action },
        });
        revalidateStudio();
        return { ok: true, message: `Deleted ${ids.length} products` };
      }

      case "assign_species": {
        const actor = await requireEditorOrUnauthorized();
        if (isUnauthorizedResult(actor)) return actor;
        const speciesIds = payload?.speciesIds ?? [];
        if (speciesIds.length === 0) {
          return { ok: false, error: "Select at least one species" };
        }
        await prisma.$transaction(async (tx) => {
          for (const lureModelId of ids) {
            await tx.lureSpecies.deleteMany({
              where: { lureModelId, associationKind: "MODERATOR_CURATED" },
            });
            await tx.lureSpecies.createMany({
              data: speciesIds.map((fishSpeciesId) => ({
                lureModelId,
                fishSpeciesId,
                associationKind: "MODERATOR_CURATED" as const,
              })),
              skipDuplicates: true,
            });
          }
        });
        await recordCatalogAudit({
          entityType: "bulk",
          entityId: ids[0]!,
          action: "BULK_ACTION",
          actor: auditActor(actor),
          summary: `Assigned species to ${ids.length} products`,
          metadata: { ids, action, speciesIds },
        });
        revalidateStudio();
        return {
          ok: true,
          message: `Assigned species to ${ids.length} products`,
        };
      }

      case "assign_techniques": {
        const actor = await requireEditorOrUnauthorized();
        if (isUnauthorizedResult(actor)) return actor;
        const techniqueIds = payload?.techniqueIds ?? [];
        if (techniqueIds.length === 0) {
          return { ok: false, error: "Select at least one technique" };
        }
        await prisma.$transaction(async (tx) => {
          for (const lureModelId of ids) {
            await tx.lureTechnique.deleteMany({ where: { lureModelId } });
            await tx.lureTechnique.createMany({
              data: techniqueIds.map((techniqueId) => ({
                lureModelId,
                techniqueId,
              })),
              skipDuplicates: true,
            });
          }
        });
        await recordCatalogAudit({
          entityType: "bulk",
          entityId: ids[0]!,
          action: "BULK_ACTION",
          actor: auditActor(actor),
          summary: `Assigned techniques to ${ids.length} products`,
          metadata: { ids, action, techniqueIds },
        });
        revalidateStudio();
        return {
          ok: true,
          message: `Assigned techniques to ${ids.length} products`,
        };
      }

      case "delete_editor_note": {
        const actor = await requireAdminOrUnauthorized();
        if (isUnauthorizedResult(actor)) return actor;
        await prisma.lureEditorNote.deleteMany({
          where: { lureModelId: { in: ids } },
        });
        await recordCatalogAudit({
          entityType: "bulk",
          entityId: ids[0]!,
          action: "BULK_ACTION",
          actor: auditActor(actor),
          summary: `Removed editor notes from ${ids.length} products`,
          metadata: { ids, action },
        });
        revalidateStudio();
        return {
          ok: true,
          message: `Removed editor notes from ${ids.length} products`,
        };
      }

      case "export": {
        const actor = await requireEditorOrUnauthorized();
        if (isUnauthorizedResult(actor)) return actor;
        const result = await exportProductsCsv(ids);
        if (!result.ok) return result;
        return { ok: true, message: "Export ready", csv: result.csv };
      }

      default:
        return { ok: false, error: "Unknown action" };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Bulk action failed",
    };
  }
}

function revalidateStudio() {
  revalidatePath("/studio");
  revalidatePath("/studio/products");
  revalidatePath("/studio/review");
}
