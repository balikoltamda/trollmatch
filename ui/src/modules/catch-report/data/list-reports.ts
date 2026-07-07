import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CatchReportReviewRow, CatchReportSummary } from "@/modules/catch-report/types";

const REPORT_INCLUDE = {
  fishSpecies: { select: { slug: true, nameEn: true, nameTr: true } },
  lureVariant: {
    select: {
      labelEn: true,
      labelTr: true,
      lureModel: {
        select: { slug: true, nameEn: true, nameTr: true },
      },
    },
  },
  technique: { select: { id: true, nameEn: true, nameTr: true } },
} satisfies Prisma.CatchReportInclude;

type ReportRaw = Prisma.CatchReportGetPayload<{ include: typeof REPORT_INCLUDE }>;

function mapReport(row: ReportRaw): CatchReportSummary {
  return {
    id: row.id,
    fishSpeciesName: { en: row.fishSpecies.nameEn, tr: row.fishSpecies.nameTr },
    fishSpeciesSlug: row.fishSpecies.slug,
    lureModelSlug: row.lureVariant.lureModel.slug,
    lureModelName: {
      en: row.lureVariant.lureModel.nameEn,
      tr: row.lureVariant.lureModel.nameTr,
    },
    lureVariantLabel: {
      en: row.lureVariant.labelEn,
      tr: row.lureVariant.labelTr,
    },
    techniqueName: row.technique
      ? { en: row.technique.nameEn, tr: row.technique.nameTr }
      : null,
    techniqueId: row.techniqueId,
    country: row.country,
    region: row.region,
    location: row.location,
    month: row.month,
    year: row.year,
    boatOrShore: row.boatOrShore,
    catchCount: row.catchCount,
    largestLengthCm: row.largestLengthCm ? Number(row.largestLengthCm) : null,
    largestWeightG: row.largestWeightG ? Number(row.largestWeightG) : null,
    photoCount: row.photoCount,
    notes: row.notes,
    verificationStatus: row.verificationStatus,
    createdAt: row.createdAt,
  };
}

export async function listApprovedCatchReportsForLure(
  lureSlug: string,
  limit = 10,
): Promise<CatchReportSummary[]> {
  try {
    const rows = await prisma.catchReport.findMany({
      where: {
        verificationStatus: "APPROVED",
        mergedIntoId: null,
        lureVariant: {
          deletedAt: null,
          lureModel: { slug: lureSlug, deletedAt: null },
        },
      },
      include: REPORT_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(mapReport);
  } catch {
    return [];
  }
}

export async function listApprovedCatchReportsForSpecies(
  speciesSlug: string,
  limit = 10,
): Promise<CatchReportSummary[]> {
  try {
    const species = await prisma.fishSpecies.findFirst({
      where: { slug: speciesSlug, deletedAt: null },
      select: { id: true },
    });
    if (!species) return [];

    const rows = await prisma.catchReport.findMany({
      where: {
        fishSpeciesId: species.id,
        verificationStatus: "APPROVED",
        mergedIntoId: null,
        lureVariant: { deletedAt: null },
      },
      include: REPORT_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(mapReport);
  } catch {
    return [];
  }
}

export async function listCatchReportsForReview(
  limit = 50,
): Promise<CatchReportReviewRow[]> {
  try {
    const rows = await prisma.catchReport.findMany({
      where: {
        verificationStatus: { in: ["PENDING", "APPROVED"] },
        mergedIntoId: null,
      },
      include: {
        ...REPORT_INCLUDE,
        lureVariant: {
          select: {
            labelEn: true,
            labelTr: true,
            lureModel: {
              select: {
                slug: true,
                nameEn: true,
                nameTr: true,
                manufacturer: { select: { nameEn: true } },
              },
            },
          },
        },
      },
      orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
      take: limit,
    });

    return rows.map((row) => ({
      ...mapReport(row),
      manufacturerName: row.lureVariant.lureModel.manufacturer.nameEn,
      mergedIntoId: row.mergedIntoId,
    }));
  } catch {
    return [];
  }
}

export async function countPendingCatchReports(): Promise<number> {
  try {
    return await prisma.catchReport.count({
      where: { verificationStatus: "PENDING", mergedIntoId: null },
    });
  } catch {
    return 0;
  }
}
