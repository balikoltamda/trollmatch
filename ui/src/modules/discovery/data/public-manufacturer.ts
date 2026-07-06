import type { DataFetchResult } from "@/lib/data-result";
import { logServerError } from "@/lib/log-server-error";
import { prisma } from "@/lib/prisma";
import type { LocalizedPair, LureCardData } from "@/modules/discovery/types";

export type PublicManufacturerData = {
  slug: string;
  name: LocalizedPair;
  countryCode: string | null;
  website: string | null;
  lures: LureCardData[];
  lureCount: number;
};

export async function getPublicManufacturerResult(
  slug: string,
): Promise<DataFetchResult<PublicManufacturerData>> {
  try {
    const manufacturer = await prisma.manufacturer.findFirst({
      where: { slug, deletedAt: null },
      select: {
        slug: true,
        nameEn: true,
        nameTr: true,
        countryCode: true,
        website: true,
      },
    });

    if (!manufacturer) {
      return { status: "not_found" };
    }

    const lureList = await listPublicLuresByManufacturer(slug);

    return {
      status: "ok",
      data: {
        slug: manufacturer.slug,
        name: { en: manufacturer.nameEn, tr: manufacturer.nameTr },
        countryCode: manufacturer.countryCode,
        website: manufacturer.website,
        lures: lureList.rows,
        lureCount: lureList.total,
      },
    };
  } catch (error) {
    await logServerError({
      page: "/[locale]/manufacturers/[slug]",
      slug,
      operation: "getPublicManufacturer",
      error,
    });
    return { status: "unavailable" };
  }
}

async function listPublicLuresByManufacturer(slug: string) {
  try {
    const rows = await prisma.lureModel.findMany({
      where: {
        deletedAt: null,
        lifecycleState: { in: ["PUBLISHED", "READY"] },
        manufacturer: { slug, deletedAt: null },
      },
      select: {
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
          orderBy: [{ role: "asc" }, { sortOrder: "asc" }],
          select: { url: true, role: true },
        },
      },
      orderBy: { nameEn: "asc" },
      take: 48,
    });

    const total = await prisma.lureModel.count({
      where: {
        deletedAt: null,
        lifecycleState: { in: ["PUBLISHED", "READY"] },
        manufacturer: { slug, deletedAt: null },
      },
    });

    return {
      rows: rows.map((row) => {
        const hero =
          row.images.find((img) => img.role === "HERO") ?? row.images[0] ?? null;
        return {
          slug: row.slug,
          manufacturer: {
            en: row.manufacturer.nameEn,
            tr: row.manufacturer.nameTr,
          },
          modelName: { en: row.nameEn, tr: row.nameTr },
          formFactor: {
            en: row.bodyTypeEn ?? "",
            tr: row.bodyTypeTr ?? row.bodyTypeEn ?? "",
          },
          imageSrc: hero?.url ?? "/lures/placeholder.svg",
          verified:
            row.lifecycleState === "PUBLISHED" || row.editorNote !== null,
        };
      }),
      total,
    };
  } catch (error) {
    await logServerError({
      page: "/[locale]/manufacturers/[slug]",
      slug,
      operation: "listPublicLuresByManufacturer",
      error,
    });
    return { rows: [], total: 0 };
  }
}
