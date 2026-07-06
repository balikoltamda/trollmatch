import type { KnowledgeAuditAction, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function recordKnowledgeAudit(input: {
  knowledgeItemId?: string;
  action: KnowledgeAuditAction;
  actor?: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.knowledgeAuditEntry.create({
    data: {
      knowledgeItemId: input.knowledgeItemId,
      action: input.action,
      actor: input.actor ?? "local-admin",
      summary: input.summary,
      metadata: input.metadata,
    },
  });
}
