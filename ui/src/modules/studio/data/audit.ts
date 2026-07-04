import type { CatalogAuditAction, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function recordCatalogAudit(input: {
  lureModelId?: string;
  entityType: string;
  entityId: string;
  action: CatalogAuditAction;
  actor?: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.catalogAuditEntry.create({
    data: {
      lureModelId: input.lureModelId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actor: input.actor ?? "local-admin",
      summary: input.summary,
      metadata: input.metadata,
    },
  });
}
