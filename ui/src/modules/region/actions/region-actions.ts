"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  auditActor,
  isUnauthorizedResult,
  requireEditorOrUnauthorized,
} from "@/modules/studio/auth/permissions";
import { recordCatalogAudit } from "@/modules/studio/data/audit";
import { regionEditSchema } from "@/modules/region/lib/validation";
import type { SaveRegionInput } from "@/modules/region/types";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveRegion(
  slug: string,
  data: SaveRegionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const parsed = regionEditSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const region = await prisma.region.update({
      where: { slug },
      data: {
        nameEn: parsed.data.nameEn,
        nameTr: parsed.data.nameTr,
        descriptionEn: emptyToNull(parsed.data.descriptionEn),
        descriptionTr: emptyToNull(parsed.data.descriptionTr),
        displayOrder: parsed.data.displayOrder,
        isActive: parsed.data.isActive,
      },
    });

    await recordCatalogAudit({
      entityType: "region",
      entityId: region.id,
      action: "EDITOR_CANONICAL",
      actor: auditActor(auth),
      summary: `Updated region (${slug})`,
    });

    revalidatePath("/studio/regions");
    revalidatePath(`/studio/regions/${slug}`);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}

export async function setRegionActive(
  slug: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const region = await prisma.region.update({
      where: { slug },
      data: { isActive },
    });

    await recordCatalogAudit({
      entityType: "region",
      entityId: region.id,
      action: "EDITOR_CANONICAL",
      actor: auditActor(auth),
      summary: `${isActive ? "Enabled" : "Disabled"} region (${slug})`,
    });

    revalidatePath("/studio/regions");
    revalidatePath(`/studio/regions/${slug}`);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

export async function moveRegion(
  slug: string,
  direction: "up" | "down",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const current = await prisma.region.findUnique({ where: { slug } });
    if (!current) {
      return { ok: false, error: "Region not found" };
    }

    const neighbor = await prisma.region.findFirst({
      where:
        direction === "up"
          ? { displayOrder: { lt: current.displayOrder } }
          : { displayOrder: { gt: current.displayOrder } },
      orderBy: {
        displayOrder: direction === "up" ? "desc" : "asc",
      },
    });

    if (!neighbor) {
      return { ok: false, error: "Already at the edge of the list" };
    }

    await prisma.$transaction([
      prisma.region.update({
        where: { id: current.id },
        data: { displayOrder: neighbor.displayOrder },
      }),
      prisma.region.update({
        where: { id: neighbor.id },
        data: { displayOrder: current.displayOrder },
      }),
    ]);

    await recordCatalogAudit({
      entityType: "region",
      entityId: current.id,
      action: "EDITOR_CANONICAL",
      actor: auditActor(auth),
      summary: `Moved region (${slug}) ${direction}`,
    });

    revalidatePath("/studio/regions");
    revalidatePath(`/studio/regions/${slug}`);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Reorder failed",
    };
  }
}
