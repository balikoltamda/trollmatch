"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordCatalogAudit } from "@/modules/studio/data/audit";
import { exportProductsCsv } from "@/modules/studio/data/products";

export type BulkAction =
  | "publish"
  | "unpublish"
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
        await prisma.lureModel.updateMany({
          where: { id: { in: ids }, deletedAt: null },
          data: { lifecycleState: "PUBLISHED" },
        });
        await recordCatalogAudit({
          entityType: "bulk",
          entityId: ids[0]!,
          action: "BULK_ACTION",
          summary: `Published ${ids.length} products`,
          metadata: { ids, action },
        });
        revalidateStudio();
        return { ok: true, message: `Published ${ids.length} products` };
      }

      case "unpublish": {
        await prisma.lureModel.updateMany({
          where: { id: { in: ids }, deletedAt: null },
          data: { lifecycleState: "READY" },
        });
        await recordCatalogAudit({
          entityType: "bulk",
          entityId: ids[0]!,
          action: "BULK_ACTION",
          summary: `Unpublished ${ids.length} products`,
          metadata: { ids, action },
        });
        revalidateStudio();
        return { ok: true, message: `Unpublished ${ids.length} products` };
      }

      case "assign_species": {
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
        revalidateStudio();
        return {
          ok: true,
          message: `Assigned species to ${ids.length} products`,
        };
      }

      case "assign_techniques": {
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
        revalidateStudio();
        return {
          ok: true,
          message: `Assigned techniques to ${ids.length} products`,
        };
      }

      case "delete_editor_note": {
        await prisma.lureEditorNote.deleteMany({
          where: { lureModelId: { in: ids } },
        });
        revalidateStudio();
        return {
          ok: true,
          message: `Removed editor notes from ${ids.length} products`,
        };
      }

      case "export": {
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
