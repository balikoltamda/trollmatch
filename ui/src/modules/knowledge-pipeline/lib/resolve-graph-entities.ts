import type { KnowledgeGraphEntityType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type GraphEntityRef = {
  entityType: KnowledgeGraphEntityType;
  entityId: string;
  slug: string;
  nameEn: string;
  nameTr: string;
};

type GraphLinkRow = {
  entityType: KnowledgeGraphEntityType;
  entityId: string;
};

export async function resolveGraphEntityRefs(
  links: GraphLinkRow[],
): Promise<GraphEntityRef[]> {
  if (links.length === 0) return [];

  const byType = new Map<KnowledgeGraphEntityType, string[]>();
  for (const link of links) {
    if (link.entityType === "KNOWLEDGE_ITEM") continue;
    const ids = byType.get(link.entityType) ?? [];
    ids.push(link.entityId);
    byType.set(link.entityType, ids);
  }

  const resolved = new Map<string, GraphEntityRef>();

  const speciesIds = byType.get("SPECIES") ?? [];
  if (speciesIds.length > 0) {
    const rows = await prisma.fishSpecies.findMany({
      where: { id: { in: speciesIds }, deletedAt: null },
      select: { id: true, slug: true, nameEn: true, nameTr: true },
    });
    for (const row of rows) {
      resolved.set(row.id, {
        entityType: "SPECIES",
        entityId: row.id,
        slug: row.slug,
        nameEn: row.nameEn,
        nameTr: row.nameTr,
      });
    }
  }

  const lureIds = byType.get("LURE_MODEL") ?? [];
  if (lureIds.length > 0) {
    const rows = await prisma.lureModel.findMany({
      where: { id: { in: lureIds }, deletedAt: null },
      select: { id: true, slug: true, nameEn: true, nameTr: true },
    });
    for (const row of rows) {
      resolved.set(row.id, {
        entityType: "LURE_MODEL",
        entityId: row.id,
        slug: row.slug,
        nameEn: row.nameEn,
        nameTr: row.nameTr,
      });
    }
  }

  const techniqueIds = byType.get("TECHNIQUE") ?? [];
  if (techniqueIds.length > 0) {
    const rows = await prisma.technique.findMany({
      where: { id: { in: techniqueIds }, deletedAt: null },
      select: { id: true, slug: true, nameEn: true, nameTr: true },
    });
    for (const row of rows) {
      resolved.set(row.id, {
        entityType: "TECHNIQUE",
        entityId: row.id,
        slug: row.slug,
        nameEn: row.nameEn,
        nameTr: row.nameTr,
      });
    }
  }

  const manufacturerIds = byType.get("MANUFACTURER") ?? [];
  if (manufacturerIds.length > 0) {
    const rows = await prisma.manufacturer.findMany({
      where: { id: { in: manufacturerIds }, deletedAt: null },
      select: { id: true, slug: true, nameEn: true, nameTr: true },
    });
    for (const row of rows) {
      resolved.set(row.id, {
        entityType: "MANUFACTURER",
        entityId: row.id,
        slug: row.slug,
        nameEn: row.nameEn,
        nameTr: row.nameTr,
      });
    }
  }

  return links
    .filter((l) => l.entityType !== "KNOWLEDGE_ITEM")
    .map((l) => resolved.get(l.entityId))
    .filter((r): r is GraphEntityRef => r !== undefined);
}

export function groupGraphRefs(refs: GraphEntityRef[]) {
  return {
    species: refs.filter((r) => r.entityType === "SPECIES"),
    lures: refs.filter((r) => r.entityType === "LURE_MODEL"),
    techniques: refs.filter((r) => r.entityType === "TECHNIQUE"),
    manufacturers: refs.filter((r) => r.entityType === "MANUFACTURER"),
  };
}
