import { prisma } from "@/lib/prisma";
import type { RegionListItem, RegionRecord, RegionSearchParams } from "@/modules/region/types";

const regionSelect = {
  id: true,
  slug: true,
  code: true,
  nameEn: true,
  nameTr: true,
  descriptionEn: true,
  descriptionTr: true,
  displayOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

function buildSearchWhere(
  params: RegionSearchParams,
): NonNullable<Parameters<typeof prisma.region.findMany>[0]>["where"] {
  const q = params.q?.trim();
  const where: NonNullable<Parameters<typeof prisma.region.findMany>[0]>["where"] =
    {};

  if (!params.includeInactive) {
    where.isActive = true;
  }

  if (q) {
    where.OR = [
      { slug: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
      { nameEn: { contains: q, mode: "insensitive" } },
      { nameTr: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listRegions(
  params: RegionSearchParams = {},
): Promise<RegionListItem[]> {
  try {
    return await prisma.region.findMany({
      where: buildSearchWhere(params),
      orderBy: [{ displayOrder: "asc" }, { nameEn: "asc" }],
      select: {
        id: true,
        slug: true,
        code: true,
        nameEn: true,
        nameTr: true,
        displayOrder: true,
        isActive: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getRegionBySlug(slug: string): Promise<RegionRecord | null> {
  try {
    return await prisma.region.findUnique({
      where: { slug },
      select: regionSelect,
    });
  } catch {
    return null;
  }
}

export async function countRegions(): Promise<number> {
  try {
    return await prisma.region.count();
  } catch {
    return 0;
  }
}
