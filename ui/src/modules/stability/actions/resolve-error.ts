"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  auditActor,
  isUnauthorizedResult,
  requireAdminOrUnauthorized,
} from "@/modules/studio/auth/permissions";

export type ResolveErrorResult = { ok: true } | { ok: false; error: string };

export async function resolveRuntimeError(
  errorId: string,
): Promise<ResolveErrorResult> {
  const auth = await requireAdminOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    await prisma.runtimeErrorLog.update({
      where: { id: errorId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: auditActor(auth),
      },
    });
    revalidatePath("/studio/errors");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not resolve error" };
  }
}
