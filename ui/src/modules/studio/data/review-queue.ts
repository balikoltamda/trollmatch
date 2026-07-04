import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  computeCompleteness,
  editorNoteHasMeaningfulContent,
  type CompletenessResult,
} from "@/modules/studio/lib/completeness";
import type { ProductListRow } from "@/modules/studio/types";

const REVIEW_QUEUE_SELECT = {
  id: true,
  slug: true,
  nameEn: true,
  nameTr: true,
  bodyTypeEn: true,
  actionEn: true,
  buoyancyEn: true,
  divingDepthMinM: true,
  divingDepthMaxM: true,
  lifecycleState: true,
  manufacturerStatus: true,
  updatedAt: true,
  manufacturer: { select: { nameEn: true, slug: true } },
  editorNote: {
    select: {
      id: true,
      shortRecommendationEn: true,
      shortRecommendationTr: true,
      currentRecommendationEn: true,
      currentRecommendationTr: true,
      mediterraneanNotesEn: true,
      mediterraneanNotesTr: true,
      internalNotes: true,
    },
  },
  images: {
    where: { deletedAt: null },
    select: { id: true, url: true, role: true },
    orderBy: [{ role: "asc" as const }, { sortOrder: "asc" as const }],
  },
  lureSpeciesLinks: {
    where: { deletedAt: null, associationKind: "MODERATOR_CURATED" as const },
    select: { id: true },
  },
  _count: {
    select: {
      images: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.LureModelSelect;

type ReviewQueueRaw = Prisma.LureModelGetPayload<{
  select: typeof REVIEW_QUEUE_SELECT;
}>;

export type ReviewQueueRow = ProductListRow & {
  completeness: CompletenessResult;
};

function mapReviewRow(row: ReviewQueueRaw): ReviewQueueRow {
  const hasCover = row.images.some((img) => img.role === "HERO");
  const completeness = computeCompleteness({
    nameTr: row.nameTr,
    bodyTypeEn: row.bodyTypeEn,
    actionEn: row.actionEn,
    buoyancyEn: row.buoyancyEn,
    divingDepthMinM: row.divingDepthMinM?.toString() ?? null,
    divingDepthMaxM: row.divingDepthMaxM?.toString() ?? null,
    imageCount: row._count.images,
    hasCoverImage: hasCover,
    moderatorSpeciesCount: row.lureSpeciesLinks.length,
    hasEditorNote: row.editorNote !== null,
    editorNoteHasContent: editorNoteHasMeaningfulContent(row.editorNote),
  });

  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameTr: row.nameTr,
    manufacturerName: row.manufacturer.nameEn,
    manufacturerSlug: row.manufacturer.slug,
    bodyTypeEn: row.bodyTypeEn,
    lifecycleState: row.lifecycleState,
    manufacturerStatus: row.manufacturerStatus,
    hasEditorNote: row.editorNote !== null,
    updatedAt: row.updatedAt,
    imageUrl: row.images[0]?.url ?? null,
    completenessScore: completeness.score,
    completenessMissing: completeness.missing,
    completeness,
  };
}

export async function listReviewQueue(limit = 50): Promise<ReviewQueueRow[]> {
  const rows = await prisma.lureModel.findMany({
    where: {
      deletedAt: null,
      lifecycleState: { in: ["DRAFT", "PENDING_REVIEW", "READY"] },
    },
    select: REVIEW_QUEUE_SELECT,
    take: 200,
  });

  const mapped = rows.map(mapReviewRow).filter((r) => r.completeness.score < 100);

  mapped.sort((a, b) => a.completeness.score - b.completeness.score);

  return mapped.slice(0, limit);
}

export async function countReviewQueue(): Promise<number> {
  const rows = await prisma.lureModel.findMany({
    where: {
      deletedAt: null,
      lifecycleState: { in: ["DRAFT", "PENDING_REVIEW", "READY"] },
    },
    select: REVIEW_QUEUE_SELECT,
  });
  return rows
    .map(mapReviewRow)
    .filter((r) => r.completeness.score < 100).length;
}
