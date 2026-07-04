import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { buildPublicLureWhere } from "@/modules/discovery/lib/build-lure-search";
import type { LureCardData, PublicLureListResult } from "@/modules/discovery/types";

const PLACEHOLDER_IMAGE = "/lures/placeholder.svg";
const DEFAULT_PAGE_SIZE = 24;

const LIST_SELECT = {
  slug: true,
  nameEn: true,
  nameTr: true,
  bodyTypeEn: true,
  bodyTypeTr: true,
  lifecycleState: true,
  manufacturer: { select: { nameEn: true, nameTr: true } },
  editorNote: { select: { id: true } },
  images: {
    where: { deletedAt: null },
    take: 1,
    orderBy: [{ role: "asc" as const }, { sortOrder: "asc" as const }],
    select: { url: true, role: true },
  },
} satisfies Prisma.LureModelSelect;

type ListRowRaw = Prisma.LureModelGetPayload<{ select: typeof LIST_SELECT }>;

function mapLureCard(row: ListRowRaw): LureCardData {
  const hero =
    row.images.find((img) => img.role === "HERO") ?? row.images[0] ?? null;

  return {
    slug: row.slug,
    manufacturer: { en: row.manufacturer.nameEn, tr: row.manufacturer.nameTr },
    modelName: { en: row.nameEn, tr: row.nameTr },
    formFactor: {
      en: row.bodyTypeEn ?? "",
      tr: row.bodyTypeTr ?? row.bodyTypeEn ?? "",
    },
    imageSrc: hero?.url ?? PLACEHOLDER_IMAGE,
    verified:
      row.lifecycleState === "PUBLISHED" || row.editorNote !== null,
  };
}

export async function listPublicLures(options: {
  q?: string | null;
  species?: string | null;
  page?: number;
  pageSize?: number;
} = {}): Promise<PublicLureListResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(48, options.pageSize ?? DEFAULT_PAGE_SIZE);
  const skip = (page - 1) * pageSize;
  const q = options.q?.trim() || null;
  const speciesSlug = options.species?.trim() || null;

  const where = buildPublicLureWhere({ q, species: speciesSlug });

  try {
    const [rows, total] = await Promise.all([
      prisma.lureModel.findMany({
        where,
        select: LIST_SELECT,
        orderBy: [{ updatedAt: "desc" }, { nameEn: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.lureModel.count({ where }),
    ]);

    return {
      rows: rows.map(mapLureCard),
      total,
      page,
      pageSize,
      query: q,
      speciesSlug,
    };
  } catch {
    return {
      rows: [],
      total: 0,
      page,
      pageSize,
      query: q,
      speciesSlug,
    };
  }
}

export async function listLuresForSpecies(
  speciesSlug: string,
  limit = 48,
): Promise<LureCardData[]> {
  const result = await listPublicLures({
    species: speciesSlug,
    page: 1,
    pageSize: limit,
  });
  return result.rows;
}
