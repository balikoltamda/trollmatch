"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordKnowledgeAudit } from "@/modules/knowledge-pipeline/data/audit";
import { STUDIO_SOURCE_ARCHIVE_PATH } from "@/modules/studio/lib/studio-routes";
import {
  auditActor,
  isUnauthorizedResult,
  requireModeratorOrUnauthorized,
} from "@/modules/studio/auth/permissions";

export type KnowledgeActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function finalizeReview(
  itemId: string,
  actorEmail: string,
  data: {
    status:
      | "APPROVED"
      | "REJECTED"
      | "MERGED"
      | "IGNORED"
      | "ARCHIVED"
      | "OUTDATED";
    editorDecision:
      | "APPROVED"
      | "REJECTED"
      | "MERGED"
      | "IGNORED"
      | "ARCHIVED"
      | "OUTDATED";
    mergedIntoId?: string;
  },
  audit: {
    action:
      | "APPROVE"
      | "REJECT"
      | "MERGE"
      | "IGNORE"
      | "ARCHIVE"
      | "FLAG_OUTDATED";
    summary: string;
  },
): Promise<KnowledgeActionResult> {
  try {
    await prisma.$transaction([
      prisma.knowledgeItem.update({
        where: { id: itemId },
        data: {
          ...data,
          reviewedAt: new Date(),
          reviewedBy: actorEmail,
        },
      }),
    ]);

    await recordKnowledgeAudit({
      knowledgeItemId: itemId,
      action: audit.action,
      actor: actorEmail,
      summary: audit.summary,
    });

    revalidatePath(STUDIO_SOURCE_ARCHIVE_PATH);
    revalidatePath("/search");
    return { ok: true };
  } catch {
    return { ok: false, error: "Action failed" };
  }
}

export async function approveKnowledgeItem(
  itemId: string,
): Promise<KnowledgeActionResult> {
  const auth = await requireModeratorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  return finalizeReview(
    itemId,
    auditActor(auth),
    { status: "APPROVED", editorDecision: "APPROVED" },
    { action: "APPROVE", summary: "Approved knowledge item" },
  );
}

export async function rejectKnowledgeItem(
  itemId: string,
): Promise<KnowledgeActionResult> {
  const auth = await requireModeratorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  return finalizeReview(
    itemId,
    auditActor(auth),
    { status: "REJECTED", editorDecision: "REJECTED" },
    { action: "REJECT", summary: "Rejected knowledge item" },
  );
}

export async function ignoreKnowledgeItem(
  itemId: string,
): Promise<KnowledgeActionResult> {
  const auth = await requireModeratorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  return finalizeReview(
    itemId,
    auditActor(auth),
    { status: "IGNORED", editorDecision: "IGNORED" },
    { action: "IGNORE", summary: "Ignored knowledge item" },
  );
}

export async function mergeKnowledgeItems(
  primaryId: string,
  duplicateId: string,
): Promise<KnowledgeActionResult> {
  const auth = await requireModeratorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  if (primaryId === duplicateId) {
    return { ok: false, error: "Cannot merge item with itself" };
  }

  const actorEmail = auditActor(auth);

  try {
    await prisma.$transaction([
      prisma.knowledgeItem.update({
        where: { id: duplicateId },
        data: {
          status: "MERGED",
          editorDecision: "MERGED",
          mergedIntoId: primaryId,
          reviewedAt: new Date(),
          reviewedBy: actorEmail,
        },
      }),
      prisma.knowledgeGraphLink.create({
        data: {
          knowledgeItemId: duplicateId,
          entityType: "KNOWLEDGE_ITEM",
          entityId: primaryId,
          relationKind: "DUPLICATE_OF",
          weight: 1,
        },
      }),
    ]);

    await recordKnowledgeAudit({
      knowledgeItemId: duplicateId,
      action: "MERGE",
      actor: actorEmail,
      summary: `Merged into knowledge item ${primaryId}`,
      metadata: { primaryId },
    });

    revalidatePath(STUDIO_SOURCE_ARCHIVE_PATH);
    revalidatePath("/search");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not merge items" };
  }
}

export async function archiveKnowledgeItem(
  itemId: string,
): Promise<KnowledgeActionResult> {
  const auth = await requireModeratorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  return finalizeReview(
    itemId,
    auditActor(auth),
    { status: "ARCHIVED", editorDecision: "ARCHIVED" },
    { action: "ARCHIVE", summary: "Archived knowledge item" },
  );
}

export async function flagKnowledgeOutdated(
  itemId: string,
): Promise<KnowledgeActionResult> {
  const auth = await requireModeratorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  return finalizeReview(
    itemId,
    auditActor(auth),
    { status: "OUTDATED", editorDecision: "OUTDATED" },
    { action: "FLAG_OUTDATED", summary: "Flagged knowledge item as outdated" },
  );
}

export async function logOpenKnowledgeSource(
  itemId: string,
  url: string,
): Promise<KnowledgeActionResult> {
  const auth = await requireModeratorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    await recordKnowledgeAudit({
      knowledgeItemId: itemId,
      action: "OPEN_SOURCE",
      actor: auditActor(auth),
      summary: "Editor opened source URL",
      metadata: { url },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not log action" };
  }
}
