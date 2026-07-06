import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  KnowledgeInboxItem,
  KnowledgeInboxStats,
} from "@/modules/knowledge-pipeline/types";

const CONFIDENCE_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

const INBOX_INCLUDE = {
  source: true,
  fishSpecies: { select: { slug: true, nameEn: true } },
  lureModel: { select: { slug: true, nameEn: true } },
  technique: { select: { slug: true, nameEn: true } },
  manufacturer: { select: { slug: true, nameEn: true } },
  _count: { select: { evidence: true, suggestions: true } },
} satisfies Prisma.KnowledgeItemInclude;

type InboxRow = Prisma.KnowledgeItemGetPayload<{ include: typeof INBOX_INCLUDE }>;

function mapInboxRow(row: InboxRow): KnowledgeInboxItem {
  const titleEn = row.titleEn ?? row.rawSnippetEn?.slice(0, 80) ?? "Untitled finding";
  const titleTr = row.titleTr ?? row.rawSnippetTr?.slice(0, 80) ?? titleEn;

  return {
    id: row.id,
    sourceType: row.source.sourceType,
    sourceName: { en: row.source.nameEn, tr: row.source.nameTr },
    sourceSlug: row.source.slug,
    url: row.url,
    title: { en: titleEn, tr: titleTr },
    snippet: {
      en: row.rawSnippetEn ?? "",
      tr: row.rawSnippetTr ?? row.rawSnippetEn ?? "",
    },
    discoveredAt: row.discoveredAt,
    confidence: row.confidence,
    status: row.status,
    editorDecision: row.editorDecision,
    country: row.country,
    region: row.region,
    relatedSpecies: row.fishSpecies
      ? { slug: row.fishSpecies.slug, name: row.fishSpecies.nameEn }
      : null,
    relatedLure: row.lureModel
      ? { slug: row.lureModel.slug, name: row.lureModel.nameEn }
      : null,
    relatedTechnique: row.technique
      ? { slug: row.technique.slug, name: row.technique.nameEn }
      : null,
    relatedManufacturer: row.manufacturer
      ? { slug: row.manufacturer.slug, name: row.manufacturer.nameEn }
      : null,
    evidenceCount: row._count.evidence,
    suggestionCount: row._count.suggestions,
    isDuplicate: row.status === "DUPLICATE" || row.mergedIntoId !== null,
    hasTaxonomyConflict: row.status === "DUPLICATE",
  };
}

export async function listKnowledgeInbox(limit = 60): Promise<KnowledgeInboxItem[]> {
  try {
    const rows = await prisma.knowledgeItem.findMany({
      where: {
        status: { in: ["DISCOVERED", "PENDING_REVIEW", "DUPLICATE"] },
        mergedIntoId: null,
      },
      include: INBOX_INCLUDE,
      orderBy: [{ discoveredAt: "desc" }],
      take: limit,
    });

    return rows
      .map(mapInboxRow)
      .sort(
        (a, b) =>
          CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence] ||
          b.discoveredAt.getTime() - a.discoveredAt.getTime(),
      );
  } catch {
    return [];
  }
}

export async function getKnowledgeInboxStats(): Promise<KnowledgeInboxStats> {
  try {
    const [pending, groups] = await Promise.all([
      prisma.knowledgeItem.count({
        where: {
          status: { in: ["DISCOVERED", "PENDING_REVIEW", "DUPLICATE"] },
          mergedIntoId: null,
        },
      }),
      prisma.knowledgeItem.groupBy({
        by: ["knowledgeSourceId"],
        where: {
          status: { in: ["DISCOVERED", "PENDING_REVIEW", "DUPLICATE"] },
          mergedIntoId: null,
        },
        _count: { _all: true },
      }),
    ]);

    const sources = await prisma.knowledgeSource.findMany({
      where: { id: { in: groups.map((g) => g.knowledgeSourceId) } },
      select: { id: true, sourceType: true },
    });
    const sourceTypeById = new Map(sources.map((s) => [s.id, s.sourceType]));

    const bySourceType: KnowledgeInboxStats["bySourceType"] = {};
    for (const group of groups) {
      const type = sourceTypeById.get(group.knowledgeSourceId);
      if (type) {
        bySourceType[type] = (bySourceType[type] ?? 0) + group._count._all;
      }
    }

    return { pending, bySourceType };
  } catch {
    return { pending: 0, bySourceType: {} };
  }
}
