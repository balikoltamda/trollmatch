import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { computeSourceScore } from "@/modules/knowledge-pipeline/lib/source-scoring";
import type {
  PublicKnowledgeCard,
  PublicKnowledgeSearchResult,
} from "@/modules/knowledge-pipeline/types";

const PUBLIC_WHERE = {
  status: "APPROVED" as const,
  mergedIntoId: null,
  source: { active: true },
};

const PUBLIC_INCLUDE = {
  source: true,
} satisfies Prisma.KnowledgeItemInclude;

type PublicRow = Prisma.KnowledgeItemGetPayload<{ include: typeof PUBLIC_INCLUDE }>;

function mapPublicCard(row: PublicRow): PublicKnowledgeCard {
  const score = computeSourceScore({
    sourceType: row.source.sourceType,
    sourceSlug: row.source.slug,
    trustTier: row.source.trustTier,
  });

  const titleEn = row.titleEn ?? "Untitled";
  const titleTr = row.titleTr ?? titleEn;
  const aiSummaryEn = row.aiSummaryEn?.trim() || null;
  const aiSummaryTr = row.aiSummaryTr?.trim() || null;

  return {
    id: row.id,
    url: row.url,
    title: { en: titleEn, tr: titleTr },
    aiSummary:
      aiSummaryEn || aiSummaryTr
        ? { en: aiSummaryEn ?? aiSummaryTr ?? "", tr: aiSummaryTr ?? aiSummaryEn ?? "" }
        : null,
    sourceType: row.source.sourceType,
    sourceName: { en: row.source.nameEn, tr: row.source.nameTr },
    sourceScore: score.score,
    region: row.region,
    country: row.country,
  };
}

async function findApprovedByEntity(
  entityType: "SPECIES" | "LURE_MODEL",
  entityId: string,
  limit: number,
): Promise<PublicKnowledgeCard[]> {
  try {
    const [direct, linked] = await Promise.all([
      prisma.knowledgeItem.findMany({
        where: {
          ...PUBLIC_WHERE,
          ...(entityType === "SPECIES"
            ? { fishSpeciesId: entityId }
            : { lureModelId: entityId }),
        },
        include: PUBLIC_INCLUDE,
        orderBy: [{ discoveredAt: "desc" }],
        take: limit,
      }),
      prisma.knowledgeItem.findMany({
        where: {
          ...PUBLIC_WHERE,
          graphLinks: {
            some: { entityType, entityId },
          },
        },
        include: PUBLIC_INCLUDE,
        orderBy: [{ discoveredAt: "desc" }],
        take: limit,
      }),
    ]);

    const seen = new Set<string>();
    const merged: PublicRow[] = [];
    for (const row of [...direct, ...linked]) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      merged.push(row);
    }

    return merged
      .map(mapPublicCard)
      .sort((a, b) => b.sourceScore - a.sourceScore)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function listApprovedKnowledgeForLureSlug(
  lureSlug: string,
  limit = 6,
): Promise<PublicKnowledgeCard[]> {
  try {
    const lure = await prisma.lureModel.findFirst({
      where: { slug: lureSlug, deletedAt: null },
      select: { id: true },
    });
    if (!lure) return [];
    return findApprovedByEntity("LURE_MODEL", lure.id, limit);
  } catch {
    return [];
  }
}

export async function listApprovedKnowledgeForSpeciesSlug(
  speciesSlug: string,
  limit = 6,
): Promise<PublicKnowledgeCard[]> {
  try {
    const species = await prisma.fishSpecies.findFirst({
      where: { slug: speciesSlug, deletedAt: null },
      select: { id: true },
    });
    if (!species) return [];
    return findApprovedByEntity("SPECIES", species.id, limit);
  } catch {
    return [];
  }
}

export function buildKnowledgeSearchWhere(q: string): Prisma.KnowledgeItemWhereInput {
  return {
    ...PUBLIC_WHERE,
    OR: [
      { titleEn: { contains: q, mode: "insensitive" } },
      { titleTr: { contains: q, mode: "insensitive" } },
      { aiSummaryEn: { contains: q, mode: "insensitive" } },
      { aiSummaryTr: { contains: q, mode: "insensitive" } },
      {
        fishSpecies: {
          OR: [
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameTr: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
          deletedAt: null,
        },
      },
      {
        lureModel: {
          OR: [
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameTr: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
          deletedAt: null,
        },
      },
      {
        technique: {
          OR: [
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameTr: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
          deletedAt: null,
        },
      },
    ],
  };
}

export async function searchPublicKnowledge(
  filters: { q?: string | null; page?: number; pageSize?: number } = {},
): Promise<PublicKnowledgeSearchResult> {
  const pageSize = filters.pageSize ?? 8;
  const page = Math.max(1, filters.page ?? 1);
  const q = filters.q?.trim() || null;

  if (!q) {
    return { query: null, rows: [], total: 0, page, pageSize };
  }

  try {
    const where = buildKnowledgeSearchWhere(q);
    const [rows, total] = await Promise.all([
      prisma.knowledgeItem.findMany({
        where,
        include: PUBLIC_INCLUDE,
        orderBy: [{ discoveredAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.knowledgeItem.count({ where }),
    ]);

    return {
      query: q,
      rows: rows.map(mapPublicCard).sort((a, b) => b.sourceScore - a.sourceScore),
      total,
      page,
      pageSize,
    };
  } catch {
    return { query: q, rows: [], total: 0, page, pageSize };
  }
}
