import { prisma } from "@/lib/prisma";
import { deriveEffectivenessBand } from "@/modules/catch-report/lib/effectiveness-band";
import { regionLabel } from "@/modules/catch-report/lib/regions";
import type {
  LureSpecies,
  LureTechnique,
  CommunityStatistics,
} from "@/modules/lure/types/lure-detail";
import type { CommunityConsensus } from "@/modules/trust/types";
import type { SpeciesTechniqueView } from "@/modules/species/types";

export const APPROVED_CATCH_REPORT_WHERE = {
  verificationStatus: "APPROVED" as const,
  mergedIntoId: null,
};

type ReportRow = {
  region: string;
  catchCount: number;
};

function aggregateStatistics(reports: ReportRow[]): CommunityStatistics {
  const verifiedCatchReportCount = reports.length;
  const usageAssertionCount = reports.reduce(
    (sum, report) => sum + report.catchCount,
    0,
  );

  const regionCounts = new Map<string, number>();
  for (const report of reports) {
    regionCounts.set(report.region, (regionCounts.get(report.region) ?? 0) + 1);
  }

  const topRegions = [...regionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug]) => regionLabel(slug));

  return {
    usageAssertionCount,
    verifiedCatchReportCount,
    effectivenessBand: deriveEffectivenessBand(verifiedCatchReportCount),
    topRegions,
  };
}

export function toCommunityConsensus(
  stats: CommunityStatistics,
): CommunityConsensus | null {
  if (stats.verifiedCatchReportCount === 0) return null;

  return {
    assertions: stats.usageAssertionCount,
    catchReports: stats.verifiedCatchReportCount,
    effectivenessBand: stats.effectivenessBand,
    summary: `${stats.verifiedCatchReportCount} verified catch reports · ${stats.usageAssertionCount} field notes · effectiveness: ${stats.effectivenessBand}`,
  };
}

export function emptyCommunityStatistics(): CommunityStatistics {
  return {
    usageAssertionCount: 0,
    verifiedCatchReportCount: 0,
    effectivenessBand: "insufficient_data",
    topRegions: [],
  };
}

export async function getCommunityStatisticsForLureModel(
  lureModelId: string,
): Promise<CommunityStatistics> {
  try {
    const reports = await prisma.catchReport.findMany({
      where: {
        ...APPROVED_CATCH_REPORT_WHERE,
        lureVariant: { lureModelId, deletedAt: null },
      },
      select: { region: true, catchCount: true },
    });
    return aggregateStatistics(reports);
  } catch {
    return emptyCommunityStatistics();
  }
}

export async function getCommunityStatisticsForSpecies(
  fishSpeciesId: string,
): Promise<CommunityStatistics> {
  try {
    const reports = await prisma.catchReport.findMany({
      where: {
        ...APPROVED_CATCH_REPORT_WHERE,
        fishSpeciesId,
        lureVariant: { deletedAt: null },
      },
      select: { region: true, catchCount: true },
    });
    return aggregateStatistics(reports);
  } catch {
    return emptyCommunityStatistics();
  }
}

export async function countApprovedCatchReportsForLureModel(
  lureModelId: string,
): Promise<number> {
  try {
    return await prisma.catchReport.count({
      where: {
        ...APPROVED_CATCH_REPORT_WHERE,
        lureVariant: { lureModelId, deletedAt: null },
      },
    });
  } catch {
    return 0;
  }
}

export async function countApprovedCatchReportsByLureModelIds(
  lureModelIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (lureModelIds.length === 0) return counts;

  try {
    const rows = await prisma.catchReport.findMany({
      where: {
        ...APPROVED_CATCH_REPORT_WHERE,
        lureVariant: {
          lureModelId: { in: lureModelIds },
          deletedAt: null,
        },
      },
      select: {
        lureVariant: { select: { lureModelId: true } },
      },
    });

    for (const row of rows) {
      const id = row.lureVariant.lureModelId;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  } catch {
    // empty map
  }

  return counts;
}

export async function getCommunitySpeciesForLureModel(
  lureModelId: string,
  excludeSlugs: string[] = [],
  limit = 8,
): Promise<LureSpecies[]> {
  try {
    const reports = await prisma.catchReport.findMany({
      where: {
        ...APPROVED_CATCH_REPORT_WHERE,
        lureVariant: { lureModelId, deletedAt: null },
        fishSpecies: { deletedAt: null },
      },
      select: {
        fishSpecies: {
          select: { slug: true, nameEn: true, nameTr: true },
        },
      },
    });

    const counts = new Map<
      string,
      { slug: string; nameEn: string; nameTr: string; count: number }
    >();

    for (const report of reports) {
      const species = report.fishSpecies;
      if (excludeSlugs.includes(species.slug)) continue;

      const existing = counts.get(species.slug);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(species.slug, {
          slug: species.slug,
          nameEn: species.nameEn,
          nameTr: species.nameTr,
          count: 1,
        });
      }
    }

    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((entry) => ({
        id: entry.slug,
        name: { en: entry.nameEn, tr: entry.nameTr },
        kind: "community" as const,
      }));
  } catch {
    return [];
  }
}

export async function getCommunityTechniquesForLureModel(
  lureModelId: string,
  excludeSlugs: string[] = [],
  limit = 8,
): Promise<LureTechnique[]> {
  try {
    const reports = await prisma.catchReport.findMany({
      where: {
        ...APPROVED_CATCH_REPORT_WHERE,
        lureVariant: { lureModelId, deletedAt: null },
        techniqueId: { not: null },
        technique: { deletedAt: null },
      },
      select: {
        technique: {
          select: { slug: true, nameEn: true, nameTr: true },
        },
      },
    });

    const counts = new Map<
      string,
      { slug: string; nameEn: string; nameTr: string; count: number }
    >();

    for (const report of reports) {
      if (!report.technique) continue;
      if (excludeSlugs.includes(report.technique.slug)) continue;

      const existing = counts.get(report.technique.slug);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(report.technique.slug, {
          slug: report.technique.slug,
          nameEn: report.technique.nameEn,
          nameTr: report.technique.nameTr,
          count: 1,
        });
      }
    }

    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((entry) => ({
        id: entry.slug,
        name: { en: entry.nameEn, tr: entry.nameTr },
      }));
  } catch {
    return [];
  }
}

export async function getCommunityTechniquesForSpecies(
  fishSpeciesId: string,
  excludeSlugs: string[] = [],
  limit = 12,
): Promise<SpeciesTechniqueView[]> {
  try {
    const reports = await prisma.catchReport.findMany({
      where: {
        ...APPROVED_CATCH_REPORT_WHERE,
        fishSpeciesId,
        techniqueId: { not: null },
        technique: { deletedAt: null },
      },
      select: {
        catchCount: true,
        technique: {
          select: { slug: true, nameEn: true, nameTr: true },
        },
      },
    });

    const counts = new Map<
      string,
      {
        slug: string;
        nameEn: string;
        nameTr: string;
        reportCount: number;
        totalCatches: number;
      }
    >();

    for (const report of reports) {
      if (!report.technique) continue;
      if (excludeSlugs.includes(report.technique.slug)) continue;

      const existing = counts.get(report.technique.slug);
      if (existing) {
        existing.reportCount += 1;
        existing.totalCatches += report.catchCount;
      } else {
        counts.set(report.technique.slug, {
          slug: report.technique.slug,
          nameEn: report.technique.nameEn,
          nameTr: report.technique.nameTr,
          reportCount: 1,
          totalCatches: report.catchCount,
        });
      }
    }

    return [...counts.values()]
      .sort((a, b) => b.reportCount - a.reportCount)
      .slice(0, limit)
      .map((entry) => ({
        slug: entry.slug,
        name: { en: entry.nameEn, tr: entry.nameTr },
        reportCount: entry.reportCount,
        totalCatches: entry.totalCatches,
      }));
  } catch {
    return [];
  }
}
