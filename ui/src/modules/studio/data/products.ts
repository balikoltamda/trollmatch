import type { ContentLifecycleState, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  computeCompleteness,
  editorNoteHasMeaningfulContent,
} from "@/modules/studio/lib/completeness";
import { EDITORIAL_STATUS_OPTIONS } from "@/modules/studio/lib/editorial";
import type { ProductListFilters, ProductListRow } from "@/modules/studio/types";

const DEFAULT_PAGE_SIZE = 25;

const LIST_SELECT = {
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
    take: 1,
    orderBy: [{ role: "asc" as const }, { sortOrder: "asc" as const }],
    select: { url: true, role: true },
  },
  lureSpeciesLinks: {
    where: { deletedAt: null, associationKind: "MODERATOR_CURATED" as const },
    select: { id: true },
  },
  _count: {
    select: { images: { where: { deletedAt: null } } },
  },
} satisfies Prisma.LureModelSelect;

type ListRowRaw = Prisma.LureModelGetPayload<{ select: typeof LIST_SELECT }>;

function mapListRow(row: ListRowRaw): ProductListRow {
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
  };
}

export async function listProducts(filters: ProductListFilters = {}): Promise<{
  rows: ProductListRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, filters.pageSize ?? DEFAULT_PAGE_SIZE);
  const skip = (page - 1) * pageSize;

  const where: Prisma.LureModelWhereInput = { deletedAt: null };

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { nameEn: { contains: q, mode: "insensitive" } },
      { nameTr: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      {
        aliases: {
          some: {
            alias: { contains: q, mode: "insensitive" },
            deletedAt: null,
          },
        },
      },
      {
        manufacturer: {
          OR: [
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameTr: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      {
        lureTechniques: {
          some: {
            deletedAt: null,
            technique: {
              OR: [
                { nameEn: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      },
      {
        lureSpeciesLinks: {
          some: {
            deletedAt: null,
            fishSpecies: {
              OR: [
                { nameEn: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      },
    ];
  }

  if (filters.manufacturer) {
    where.manufacturer = { slug: filters.manufacturer, deletedAt: null };
  }

  if (filters.bodyType) {
    where.bodyTypeSlug = filters.bodyType;
  }

  if (filters.lifecycle) {
    where.lifecycleState = filters.lifecycle;
  }

  if (filters.needsReview) {
    where.lifecycleState = "PENDING_REVIEW";
  }

  if (filters.hasEditorNote) {
    where.editorNote = { isNot: null };
  }

  if (filters.technique) {
    where.lureTechniques = {
      some: {
        deletedAt: null,
        technique: { slug: filters.technique },
      },
    };
  }

  if (filters.species) {
    where.lureSpeciesLinks = {
      some: {
        deletedAt: null,
        fishSpecies: { slug: filters.species },
      },
    };
  }

  const [rows, total] = await Promise.all([
    prisma.lureModel.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
      select: LIST_SELECT,
    }),
    prisma.lureModel.count({ where }),
  ]);

  return {
    rows: rows.map(mapListRow),
    total,
    page,
    pageSize,
  };
}

export async function listManufacturerOptions() {
  return prisma.manufacturer.findMany({
    where: { deletedAt: null },
    orderBy: { nameEn: "asc" },
    select: { slug: true, nameEn: true },
  });
}

export async function listBodyTypeOptions() {
  const rows = await prisma.lureModel.findMany({
    where: { deletedAt: null, bodyTypeSlug: { not: null } },
    distinct: ["bodyTypeSlug"],
    select: { bodyTypeSlug: true, bodyTypeEn: true },
    orderBy: { bodyTypeEn: "asc" },
  });
  return rows
    .filter((r) => r.bodyTypeSlug)
    .map((r) => ({ slug: r.bodyTypeSlug!, label: r.bodyTypeEn ?? r.bodyTypeSlug! }));
}

export async function listTechniqueFilterOptions() {
  return prisma.technique.findMany({
    where: { deletedAt: null },
    orderBy: { nameEn: "asc" },
    select: { slug: true, nameEn: true },
    take: 100,
  });
}

export async function listSpeciesFilterOptions() {
  return prisma.fishSpecies.findMany({
    where: { deletedAt: null },
    orderBy: { nameEn: "asc" },
    select: { slug: true, nameEn: true },
    take: 100,
  });
}

export const LIFECYCLE_OPTIONS: ContentLifecycleState[] = EDITORIAL_STATUS_OPTIONS;

export async function exportProductsCsv(
  ids: string[],
): Promise<{ ok: true; csv: string } | { ok: false; error: string }> {
  if (ids.length === 0) {
    return { ok: false, error: "No products selected" };
  }

  const rows = await prisma.lureModel.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: {
      slug: true,
      nameEn: true,
      nameTr: true,
      lifecycleState: true,
      manufacturer: { select: { nameEn: true } },
    },
    orderBy: { nameEn: "asc" },
  });

  const header = "slug,name_en,name_tr,manufacturer,status";
  const lines = rows.map((r) =>
    [
      r.slug,
      r.nameEn,
      r.nameTr,
      r.manufacturer.nameEn,
      r.lifecycleState,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );

  return { ok: true, csv: [header, ...lines].join("\n") };
}
