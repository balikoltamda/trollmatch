"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  auditActor,
  isUnauthorizedResult,
  requireEditorOrUnauthorized,
} from "@/modules/studio/auth/permissions";
import { recordCatalogAudit } from "@/modules/studio/data/audit";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveManufacturer(
  slug: string,
  data: {
    nameEn: string;
    nameTr: string;
    countryCode: string;
    website: string;
    logoUrl: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const nameEn = data.nameEn.trim();
  const nameTr = data.nameTr.trim();
  if (!nameEn || !nameTr) {
    return { ok: false, error: "English and Turkish names are required" };
  }

  const countryCode = emptyToNull(data.countryCode);
  if (countryCode && countryCode.length !== 2) {
    return { ok: false, error: "Country code must be 2 letters (ISO)" };
  }

  try {
    const manufacturer = await prisma.manufacturer.update({
      where: { slug, deletedAt: null },
      data: {
        nameEn,
        nameTr,
        countryCode,
        website: emptyToNull(data.website),
        logoUrl: emptyToNull(data.logoUrl),
      },
    });

    await recordCatalogAudit({
      entityType: "manufacturer",
      entityId: manufacturer.id,
      action: "EDITOR_CANONICAL",
      actor: auditActor(auth),
      summary: `Updated manufacturer profile (${slug})`,
    });

    revalidatePath("/studio/manufacturers");
    revalidatePath(`/studio/manufacturers/${slug}`);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}
