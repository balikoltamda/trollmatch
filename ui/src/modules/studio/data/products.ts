import type { ContentLifecycleState, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProductListFilters, ProductListRow } from "@/modules/studio/types";

const DEFAULT_PAGE_SIZE = 25;

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

  const [rows, total] = await Promise.all([
    prisma.lureModel.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameTr: true,
        bodyTypeEn: true,
        lifecycleState: true,
        manufacturerStatus: true,
        updatedAt: true,
        manufacturer: { select: { nameEn: true, slug: true } },
        editorNote: { select: { id: true } },
        images: {
          where: { deletedAt: null },
          take: 1,
          orderBy: [{ role: "asc" }, { sortOrder: "asc" }],
          select: { url: true },
        },
      },
    }),
    prisma.lureModel.count({ where }),
  ]);

  return {
    rows: rows.map((row) => ({
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
    })),
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

export const LIFECYCLE_OPTIONS: ContentLifecycleState[] = [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "DEPRECATED",
  "REJECTED",
];
