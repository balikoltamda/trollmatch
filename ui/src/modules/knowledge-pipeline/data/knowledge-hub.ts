import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  groupGraphRefs,
  resolveGraphEntityRefs,
} from "@/modules/knowledge-pipeline/lib/resolve-graph-entities";
import { computeSourceScore } from "@/modules/knowledge-pipeline/lib/source-scoring";
import type {
  KnowledgeHubItem,
  KnowledgeHubStats,
} from "@/modules/knowledge-pipeline/types";

const CONFIDENCE_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

const HUB_INCLUDE = {
  source: true,
  fishSpecies: { select: { slug: true, nameEn: true, nameTr: true } },
  lureModel: { select: { slug: true, nameEn: true, nameTr: true } },
  technique: { select: { slug: true, nameEn: true, nameTr: true } },
  manufacturer: { select: { slug: true, nameEn: true, nameTr: true } },
  graphLinks: {
    select: { entityType: true, entityId: true },
  },
  _count: { select: { evidence: true, suggestions: true } },
} satisfies Prisma.KnowledgeItemInclude;

type HubRow = Prisma.KnowledgeItemGetPayload<{ include: typeof HUB_INCLUDE }>;

function refFromRow(
  row: { slug: string; nameEn: string; nameTr: string } | null | undefined,
): { slug: string; name: { en: string; tr: string } } | null {
  if (!row) return null;
  return { slug: row.slug, name: { en: row.nameEn, tr: row.nameTr } };
}

function dedupeRefs(
  refs: Array<{ slug: string; name: { en: string; tr: string } }>,
): Array<{ slug: string; name: { en: string; tr: string } }> {
  const seen = new Set<string>();
  return refs.filter((r) => {
    if (seen.has(r.slug)) return false;
    seen.add(r.slug);
    return true;
  });
}

async function mapHubRow(row: HubRow): Promise<KnowledgeHubItem> {
  const titleEn = row.titleEn ?? "Untitled finding";
  const titleTr = row.titleTr ?? titleEn;
  const aiSummaryEn = row.aiSummaryEn?.trim() || null;
  const aiSummaryTr = row.aiSummaryTr?.trim() || null;
  const previewEn = row.sourcePreviewEn?.trim() || null;
  const previewTr = row.sourcePreviewTr?.trim() || null;

  const graphRefs = await resolveGraphEntityRefs(row.graphLinks);
  const grouped = groupGraphRefs(graphRefs);

  const primarySpecies = refFromRow(row.fishSpecies);
  const primaryLure = refFromRow(row.lureModel);
  const primaryTechnique = refFromRow(row.technique);
  const primaryManufacturer = refFromRow(row.manufacturer);

  const score = computeSourceScore({
    sourceType: row.source.sourceType,
    sourceSlug: row.source.slug,
    trustTier: row.source.trustTier,
  });

  return {
    id: row.id,
    sourceType: row.source.sourceType,
    sourceName: { en: row.source.nameEn, tr: row.source.nameTr },
    sourceSlug: row.source.slug,
    url: row.url,
    title: { en: titleEn, tr: titleTr },
    language: row.language,
    aiSummary:
      aiSummaryEn || aiSummaryTr
        ? { en: aiSummaryEn ?? aiSummaryTr ?? "", tr: aiSummaryTr ?? aiSummaryEn ?? "" }
        : null,
    sourcePreview:
      previewEn || previewTr
        ? { en: previewEn ?? previewTr ?? "", tr: previewTr ?? previewEn ?? "" }
        : null,
    discoveredAt: row.discoveredAt,
    confidence: row.confidence,
    status: row.status,
    editorDecision: row.editorDecision,
    country: row.country,
    region: row.region,
    relatedSpecies: dedupeRefs([
      ...(primarySpecies ? [primarySpecies] : []),
      ...grouped.species.map((s) => ({
        slug: s.slug,
        name: { en: s.nameEn, tr: s.nameTr },
      })),
    ]),
    relatedLures: dedupeRefs([
      ...(primaryLure ? [primaryLure] : []),
      ...grouped.lures.map((l) => ({
        slug: l.slug,
        name: { en: l.nameEn, tr: l.nameTr },
      })),
    ]),
    relatedTechniques: dedupeRefs([
      ...(primaryTechnique ? [primaryTechnique] : []),
      ...grouped.techniques.map((t) => ({
        slug: t.slug,
        name: { en: t.nameEn, tr: t.nameTr },
      })),
    ]),
    relatedManufacturers: dedupeRefs([
      ...(primaryManufacturer ? [primaryManufacturer] : []),
      ...grouped.manufacturers.map((m) => ({
        slug: m.slug,
        name: { en: m.nameEn, tr: m.nameTr },
      })),
    ]),
    sourceScore: score.score,
    sourceScoreCategory: score.category,
    sourceScoreCategoryLabel: score.categoryLabel,
    evidenceCount: row._count.evidence,
    suggestionCount: row._count.suggestions,
    isDuplicate: row.status === "DUPLICATE" || row.mergedIntoId !== null,
    hasTaxonomyConflict: row.status === "DUPLICATE",
  };
}

const REVIEW_STATUSES = ["DISCOVERED", "PENDING_REVIEW", "DUPLICATE"] as const;

export async function listKnowledgeHub(limit = 80): Promise<KnowledgeHubItem[]> {
  try {
    const rows = await prisma.knowledgeItem.findMany({
      where: {
        status: { in: [...REVIEW_STATUSES] },
        mergedIntoId: null,
      },
      include: HUB_INCLUDE,
      orderBy: [{ discoveredAt: "desc" }],
      take: limit,
    });

    const mapped = await Promise.all(rows.map(mapHubRow));
    return mapped.sort(
      (a, b) =>
        b.sourceScore - a.sourceScore ||
        CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence] ||
        b.discoveredAt.getTime() - a.discoveredAt.getTime(),
    );
  } catch {
    return [];
  }
}

export async function getKnowledgeHubStats(): Promise<KnowledgeHubStats> {
  try {
    const [pending, approved, archived, outdated, groups] = await Promise.all([
      prisma.knowledgeItem.count({
        where: { status: { in: [...REVIEW_STATUSES] }, mergedIntoId: null },
      }),
      prisma.knowledgeItem.count({
        where: { status: "APPROVED", mergedIntoId: null },
      }),
      prisma.knowledgeItem.count({
        where: { status: "ARCHIVED", mergedIntoId: null },
      }),
      prisma.knowledgeItem.count({
        where: { status: "OUTDATED", mergedIntoId: null },
      }),
      prisma.knowledgeItem.groupBy({
        by: ["knowledgeSourceId"],
        where: { status: { in: [...REVIEW_STATUSES] }, mergedIntoId: null },
        _count: { _all: true },
      }),
    ]);

    const sources = await prisma.knowledgeSource.findMany({
      where: { id: { in: groups.map((g) => g.knowledgeSourceId) } },
      select: { id: true, sourceType: true },
    });
    const sourceTypeById = new Map(sources.map((s) => [s.id, s.sourceType]));

    const bySourceType: KnowledgeHubStats["bySourceType"] = {};
    for (const group of groups) {
      const type = sourceTypeById.get(group.knowledgeSourceId);
      if (type) {
        bySourceType[type] = (bySourceType[type] ?? 0) + group._count._all;
      }
    }

    return { pending, approved, archived, outdated, bySourceType };
  } catch {
    return { pending: 0, approved: 0, archived: 0, outdated: 0, bySourceType: {} };
  }
}

/** @deprecated Use listKnowledgeHub */
export const listKnowledgeInbox = listKnowledgeHub;

/** @deprecated Use getKnowledgeHubStats */
export const getKnowledgeInboxStats = getKnowledgeHubStats;
