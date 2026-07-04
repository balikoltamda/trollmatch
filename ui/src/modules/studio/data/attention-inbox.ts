import type {
  ContentLifecycleState,
  EditorNoteConfidence,
  SuggestionSource,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureAttentionSuggestions } from "@/modules/studio/lib/suggestion-generator";
import { computeTrustScore } from "@/modules/trust/lib/derive-verification";
import { LURE_DETAIL_ENRICHMENTS } from "@/modules/lure/data/lure-detail-enrichment";

export type AttentionItem = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  manufacturerName: string;
  lifecycleState: ContentLifecycleState;
  priority: number;
  pendingCount: number;
  topSuggestion: {
    id: string;
    fieldLabel: string;
    currentValue: string | null;
    suggestedValue: string | null;
    confidence: EditorNoteConfidence;
    source: SuggestionSource;
    reasoning: string | null;
    provenance: Record<string, unknown> | null;
    kind: string;
  } | null;
  publishReady: boolean;
  trustScore: number;
};

const SOURCE_PRIORITY: Record<SuggestionSource, number> = {
  IMPORTER: 1,
  COMMUNITY_REPORT: 2,
  AI_SUMMARY: 3,
  AI_ENRICHMENT: 4,
  EDITOR: 5,
};

const CONFIDENCE_PRIORITY: Record<EditorNoteConfidence, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

function priorityScore(
  source: SuggestionSource,
  confidence: EditorNoteConfidence,
): number {
  return SOURCE_PRIORITY[source] * 10 + CONFIDENCE_PRIORITY[confidence];
}

export async function getAttentionInbox(limit = 50): Promise<AttentionItem[]> {
  await ensureAttentionSuggestions(40);

  const grouped = await prisma.catalogSuggestion.groupBy({
    by: ["lureModelId"],
    where: { status: "PENDING" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) {
    return listPublishReadyWithoutSuggestions(limit);
  }

  const productIds = grouped.map((g) => g.lureModelId);
  const [products, topSuggestions] = await Promise.all([
    prisma.lureModel.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        lifecycleState: true,
        lastImportedAt: true,
        manufacturerStatus: true,
        manufacturer: { select: { nameEn: true } },
        editorNote: { select: { confidence: true } },
      },
    }),
    prisma.catalogSuggestion.findMany({
      where: { lureModelId: { in: productIds }, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const items = grouped
    .map((group) => {
      const product = productMap.get(group.lureModelId);
      if (!product) return null;

      const suggestions = topSuggestions.filter(
        (s) => s.lureModelId === group.lureModelId,
      );
      const sorted = [...suggestions].sort(
        (a, b) =>
          priorityScore(a.source, a.confidence) -
          priorityScore(b.source, b.confidence),
      );
      const top = sorted[0];
      if (!top) return null;

      const community =
        LURE_DETAIL_ENRICHMENTS[product.slug]?.communityStatistics
          .verifiedCatchReportCount ?? 0;

      const trustScore = computeTrustScore({
        lifecycleState: product.lifecycleState,
        editorConfidence: product.editorNote?.confidence ?? null,
        lastImportedAt: product.lastImportedAt,
        pendingSuggestions: group._count.id,
        hasEditorNote: product.editorNote !== null,
        communityCatchReports: community,
        manufacturerActive: product.manufacturerStatus === "ACTIVE",
      });

      const item: AttentionItem = {
        id: `attention-${product.id}`,
        productId: product.id,
        productName: product.nameEn,
        productSlug: product.slug,
        manufacturerName: product.manufacturer.nameEn,
        lifecycleState: product.lifecycleState,
        priority: priorityScore(top.source, top.confidence),
        pendingCount: group._count.id,
        topSuggestion: {
          id: top.id,
          fieldLabel: top.fieldLabel,
          currentValue: top.currentValue,
          suggestedValue: top.suggestedValue,
          confidence: top.confidence,
          source: top.source,
          reasoning: top.reasoning,
          provenance:
            top.provenance && typeof top.provenance === "object"
              ? (top.provenance as Record<string, unknown>)
              : null,
          kind: top.kind,
        },
        publishReady: false,
        trustScore,
      };
      return item;
    })
    .filter((item): item is AttentionItem => item !== null);

  items.sort((a, b) => a.priority - b.priority);

  const publishReady = await listPublishReadyWithoutSuggestions(
    Math.max(0, limit - items.length),
  );

  return [...items, ...publishReady].slice(0, limit);
}

async function listPublishReadyWithoutSuggestions(
  limit: number,
): Promise<AttentionItem[]> {
  if (limit <= 0) return [];

  const ready = await prisma.lureModel.findMany({
    where: {
      deletedAt: null,
      lifecycleState: "READY",
      catalogSuggestions: { none: { status: "PENDING" } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      nameEn: true,
      lifecycleState: true,
      lastImportedAt: true,
      manufacturerStatus: true,
      manufacturer: { select: { nameEn: true } },
      editorNote: { select: { confidence: true } },
    },
  });

  return ready.map((product) => ({
    id: `publish-${product.id}`,
    productId: product.id,
    productName: product.nameEn,
    productSlug: product.slug,
    manufacturerName: product.manufacturer.nameEn,
    lifecycleState: product.lifecycleState,
    priority: 50,
    pendingCount: 0,
    topSuggestion: null,
    publishReady: true,
    trustScore: computeTrustScore({
      lifecycleState: product.lifecycleState,
      editorConfidence: product.editorNote?.confidence ?? null,
      lastImportedAt: product.lastImportedAt,
      pendingSuggestions: 0,
      hasEditorNote: product.editorNote !== null,
      communityCatchReports:
        LURE_DETAIL_ENRICHMENTS[product.slug]?.communityStatistics
          .verifiedCatchReportCount ?? 0,
      manufacturerActive: product.manufacturerStatus === "ACTIVE",
    }),
  }));
}

export async function countAttentionItems(): Promise<number> {
  const [pendingSuggestions, publishReady] = await Promise.all([
    prisma.catalogSuggestion.groupBy({
      by: ["lureModelId"],
      where: { status: "PENDING" },
    }),
    prisma.lureModel.count({
      where: {
        deletedAt: null,
        lifecycleState: "READY",
        catalogSuggestions: { none: { status: "PENDING" } },
      },
    }),
  ]);

  return pendingSuggestions.length + publishReady;
}

export async function listProductSuggestions(lureModelId: string) {
  const { ensureProductSuggestions } = await import(
    "@/modules/studio/lib/suggestion-generator"
  );
  await ensureProductSuggestions(lureModelId);

  return prisma.catalogSuggestion.findMany({
    where: { lureModelId, status: "PENDING" },
    orderBy: [{ source: "asc" }, { createdAt: "desc" }],
  });
}

export async function listCommunitySuggestions(limit = 50) {
  return prisma.catalogSuggestion.findMany({
    where: { status: "PENDING", source: "COMMUNITY_REPORT" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      lureModel: {
        select: {
          id: true,
          slug: true,
          nameEn: true,
          manufacturer: { select: { nameEn: true } },
        },
      },
    },
  });
}

