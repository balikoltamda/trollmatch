"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  isUnauthorizedResult,
  requireEditorOrUnauthorized,
} from "@/modules/studio/auth/permissions";
import {
  cancelQueuedImportBatch,
  createQueuedImportBatch,
} from "@/modules/studio/data/execute-import-batch";
import { spawnImportBatchWorker } from "@/modules/studio/lib/spawn-import-batch-worker";

export async function enqueueManufacturerImport(
  manufacturerCode: string,
): Promise<
  | { ok: true; batchId: string }
  | { ok: false; error: string }
> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const created = await createQueuedImportBatch(prisma, manufacturerCode);

  if ("error" in created) {
    return { ok: false, error: created.error };
  }

  try {
    spawnImportBatchWorker(created.batchId);
  } catch (error) {
    await prisma.importBatch.update({
      where: { id: created.batchId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorCount: 1,
        reportJson: {
          errors: [
            error instanceof Error
              ? error.message
              : "Failed to start background worker",
          ],
        },
      },
    });
    return {
      ok: false,
      error: "Could not start background import worker",
    };
  }

  revalidatePath("/studio");
  revalidatePath("/studio/import");

  return { ok: true, batchId: created.batchId };
}

/** @deprecated Use enqueueManufacturerImport — imports run in background workers. */
export async function runManufacturerImport(manufacturerCode: string) {
  return enqueueManufacturerImport(manufacturerCode);
}

export async function cancelManufacturerImport(
  batchId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const result = await cancelQueuedImportBatch(prisma, batchId);

  if (!result.ok) {
    return result;
  }

  revalidatePath("/studio");
  revalidatePath("/studio/import");

  return { ok: true };
}
