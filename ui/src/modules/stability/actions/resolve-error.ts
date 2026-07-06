"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ResolveErrorResult = { ok: true } | { ok: false; error: string };

export async function resolveRuntimeError(
  errorId: string,
): Promise<ResolveErrorResult> {
  try {
    await prisma.runtimeErrorLog.update({
      where: { id: errorId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: "local-admin",
      },
    });
    revalidatePath("/studio/errors");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not resolve error" };
  }
}
