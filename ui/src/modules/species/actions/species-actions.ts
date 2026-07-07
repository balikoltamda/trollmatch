"use server";

import { revalidatePath } from "next/cache";
import type { ContentLifecycleState } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  auditActor,
  isUnauthorizedResult,
  requireEditorOrUnauthorized,
} from "@/modules/studio/auth/permissions";
import { recordCatalogAudit } from "@/modules/studio/data/audit";
import {
  STUDIO_SPECIES_PATH,
  studioSpeciesDetailPath,
} from "@/modules/studio/lib/studio-routes";
import { triggerEditorialReview } from "@/modules/studio/ai-review/lib/trigger-editorial-review";
import type { ReviewTrigger } from "@/modules/studio/ai-review/lib/run-editorial-review";
import {
  archiveSpeciesRecord,
  restoreSpeciesRecord,
  saveSpeciesConfusions,
  setSpeciesProfileLifecycle,
  upsertSpeciesFromStudioInput,
} from "@/modules/species/repositories/species-repository";
import {
  speciesConfusionInputSchema,
  speciesCreateSchema,
  speciesSaveSchema,
} from "@/modules/species/lib/validation";
import { slugifySpeciesEn, slugifySpeciesTr } from "@/modules/species/lib/slug";
import { routing } from "@/i18n/routing";

function revalidateSpeciesPaths(slugEn: string, slugTr?: string) {
  revalidatePath(STUDIO_SPECIES_PATH);
  revalidatePath(studioSpeciesDetailPath(slugEn));
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/species`);
    revalidatePath(`/${locale}/species/${slugEn}`);
    if (slugTr) revalidatePath(`/${locale}/species/${slugTr}`);
  }
  revalidatePath("/tr/search");
  revalidatePath("/en/search");
}

export async function createSpecies(
  data: unknown,
): Promise<
  { ok: true; slugEn: string } | { ok: false; error: string }
> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const parsed = speciesCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const result = await upsertSpeciesFromStudioInput(null, parsed.data);
    await recordCatalogAudit({
      entityType: "fish_species",
      entityId: result.id,
      action: "EDITOR_CANONICAL",
      actor: auditActor(auth),
      summary: `Created species ${parsed.data.nameEn}`,
    });
    revalidateSpeciesPaths(result.slugEn, parsed.data.slugTr);
    await triggerEditorialReview("SPECIES", result.id, "CREATE", auditActor(auth)).catch(() => {});
    return { ok: true, slugEn: result.slugEn };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
}

export async function saveSpecies(
  speciesId: string,
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const parsed = speciesSaveSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const result = await upsertSpeciesFromStudioInput(speciesId, parsed.data);
    await recordCatalogAudit({
      entityType: "fish_species",
      entityId: speciesId,
      action: "EDITOR_CANONICAL",
      actor: auditActor(auth),
      summary: `Updated species ${parsed.data.nameEn}`,
    });
    revalidateSpeciesPaths(result.slugEn, parsed.data.slugTr);
    await triggerEditorialReview("SPECIES", speciesId, "EDIT", auditActor(auth)).catch(() => {});
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}

export async function saveSpeciesConfusionsAction(
  speciesId: string,
  confusions: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const list = Array.isArray(confusions) ? confusions : [];
  const parsed = list.map((item) => speciesConfusionInputSchema.safeParse(item));
  if (parsed.some((result) => !result.success)) {
    return { ok: false, error: "Invalid confusion entry" };
  }

  try {
    const species = await prisma.fishSpecies.findFirst({
      where: { id: speciesId },
      select: { slugEn: true, slugTr: true },
    });
    if (!species) return { ok: false, error: "Species not found" };

    await saveSpeciesConfusions(
      speciesId,
      parsed.map((result) => ({
        confusedWithSpeciesId: result.data!.confusedWithSpeciesId,
        misappliedNameEn: result.data!.misappliedNameEn ?? "",
        misappliedNameTr: result.data!.misappliedNameTr ?? "",
        reasonEn: result.data!.reasonEn,
        reasonTr: result.data!.reasonTr,
      })),
    );

    await recordCatalogAudit({
      entityType: "fish_species",
      entityId: speciesId,
      action: "EDITOR_CANONICAL",
      actor: auditActor(auth),
      summary: "Updated species confusions",
    });

    revalidateSpeciesPaths(species.slugEn, species.slugTr);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}

async function lifecycleAction(
  speciesId: string,
  lifecycleState: ContentLifecycleState,
  action: "PUBLISH" | "UNPUBLISH" | "LIFECYCLE_CHANGE",
  summary: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const species = await prisma.fishSpecies.findFirst({
      where: { id: speciesId },
      select: { slugEn: true, slugTr: true, deletedAt: true },
    });
    if (!species || species.deletedAt) {
      return { ok: false, error: "Species not found or archived" };
    }

    const slugEn = await setSpeciesProfileLifecycle(speciesId, lifecycleState);

    await recordCatalogAudit({
      entityType: "fish_species",
      entityId: speciesId,
      action,
      actor: auditActor(auth),
      summary,
    });

    revalidateSpeciesPaths(slugEn, species.slugTr);

    const trigger: ReviewTrigger =
      action === "PUBLISH" ? "PUBLISH" : action === "UNPUBLISH" ? "ARCHIVE" : "EDIT";
    await triggerEditorialReview("SPECIES", speciesId, trigger, auditActor(auth)).catch(() => {});

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

export async function publishSpecies(
  speciesId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return lifecycleAction(speciesId, "PUBLISHED", "PUBLISH", "Published species");
}

export async function unpublishSpecies(
  speciesId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return lifecycleAction(speciesId, "READY", "UNPUBLISH", "Unpublished species");
}

export async function markSpeciesReady(
  speciesId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return lifecycleAction(speciesId, "READY", "LIFECYCLE_CHANGE", "Marked species ready");
}

export async function rejectSpecies(
  speciesId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return lifecycleAction(speciesId, "REJECTED", "LIFECYCLE_CHANGE", "Rejected species");
}

export async function archiveSpecies(
  speciesId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const slugEn = await archiveSpeciesRecord(speciesId);
    await recordCatalogAudit({
      entityType: "fish_species",
      entityId: speciesId,
      action: "LIFECYCLE_CHANGE",
      actor: auditActor(auth),
      summary: "Archived species",
    });
    revalidateSpeciesPaths(slugEn);
    await triggerEditorialReview("SPECIES", speciesId, "ARCHIVE", auditActor(auth)).catch(() => {});
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Archive failed",
    };
  }
}

export async function restoreSpecies(
  speciesId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const slugEn = await restoreSpeciesRecord(speciesId);
    await recordCatalogAudit({
      entityType: "fish_species",
      entityId: speciesId,
      action: "LIFECYCLE_CHANGE",
      actor: auditActor(auth),
      summary: "Restored species",
    });
    revalidateSpeciesPaths(slugEn);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Restore failed",
    };
  }
}

export async function suggestSpeciesSlugs(
  nameEn: string,
  nameTr: string,
): Promise<{ slugEn: string; slugTr: string }> {
  return {
    slugEn: slugifySpeciesEn(nameEn),
    slugTr: slugifySpeciesTr(nameTr),
  };
}
