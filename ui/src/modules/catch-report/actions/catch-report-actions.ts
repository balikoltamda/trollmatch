"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SubmitCatchReportInput } from "@/modules/catch-report/types";

export type CatchReportActionResult =
  | { ok: true }
  | { ok: false; error: string };

function validateSubmitInput(
  input: SubmitCatchReportInput,
): CatchReportActionResult {
  if (!input.fishSpeciesId?.trim()) {
    return { ok: false, error: "Fish species is required" };
  }
  if (!input.lureVariantId?.trim()) {
    return { ok: false, error: "Lure variant is required" };
  }
  if (!input.techniqueId?.trim()) {
    return { ok: false, error: "Fishing technique is required" };
  }
  if (!input.country?.trim() || input.country.length !== 2) {
    return { ok: false, error: "Country is required" };
  }
  if (!input.region?.trim()) {
    return { ok: false, error: "Region is required" };
  }
  if (input.month < 1 || input.month > 12) {
    return { ok: false, error: "Invalid month" };
  }
  if (input.year < 1990 || input.year > 2100) {
    return { ok: false, error: "Invalid year" };
  }
  if (input.catchCount < 1 || input.catchCount > 999) {
    return { ok: false, error: "Invalid catch count" };
  }
  return { ok: true };
}

export async function submitCatchReport(
  input: SubmitCatchReportInput,
): Promise<CatchReportActionResult> {
  const validation = validateSubmitInput(input);
  if (!validation.ok) {
    return validation;
  }

  try {
    const variant = await prisma.lureVariant.findFirst({
      where: { id: input.lureVariantId, deletedAt: null },
      select: { lureModel: { select: { slug: true } } },
    });

    if (!variant) {
      return { ok: false, error: "Lure not found" };
    }

    const technique = await prisma.technique.findFirst({
      where: { id: input.techniqueId, deletedAt: null },
      select: { id: true },
    });

    if (!technique) {
      return { ok: false, error: "Fishing technique is required" };
    }

    await prisma.catchReport.create({
      data: {
        fishSpeciesId: input.fishSpeciesId,
        lureVariantId: input.lureVariantId,
        techniqueId: input.techniqueId,
        country: input.country.toUpperCase(),
        region: input.region.trim(),
        location: input.location?.trim() || null,
        month: input.month,
        year: input.year,
        boatOrShore: input.boatOrShore,
        catchCount: input.catchCount,
        notes: input.notes?.trim() || null,
        waterDepthM:
          input.waterDepthM != null
            ? new Prisma.Decimal(input.waterDepthM)
            : null,
        lureDepthM:
          input.lureDepthM != null
            ? new Prisma.Decimal(input.lureDepthM)
            : null,
        trollingSpeedKn:
          input.trollingSpeedKn != null
            ? new Prisma.Decimal(input.trollingSpeedKn)
            : null,
        largestLengthCm:
          input.largestLengthCm != null
            ? new Prisma.Decimal(input.largestLengthCm)
            : null,
        largestWeightG:
          input.largestWeightG != null
            ? new Prisma.Decimal(input.largestWeightG)
            : null,
        photoCount: input.photoCount ?? 0,
        verificationStatus: "PENDING",
      },
    });

    revalidatePath("/studio/community/reports");
    revalidatePath(`/tr/lures/${variant.lureModel.slug}`);
    revalidatePath(`/en/lures/${variant.lureModel.slug}`);

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save report" };
  }
}

async function getReportLureSlug(reportId: string): Promise<string | null> {
  const report = await prisma.catchReport.findUnique({
    where: { id: reportId },
    select: {
      fishSpecies: { select: { slug: true } },
      lureVariant: { select: { lureModel: { select: { slug: true } } } },
    },
  });
  return report?.lureVariant.lureModel.slug ?? null;
}

function revalidateCatchReportPaths(
  lureSlug: string | null,
  speciesSlug?: string | null,
) {
  revalidatePath("/studio/community/reports");
  if (lureSlug) {
    revalidatePath(`/tr/lures/${lureSlug}`);
    revalidatePath(`/en/lures/${lureSlug}`);
  }
  if (speciesSlug) {
    revalidatePath(`/tr/species/${speciesSlug}`);
    revalidatePath(`/en/species/${speciesSlug}`);
  }
}

export async function approveCatchReport(
  reportId: string,
): Promise<CatchReportActionResult> {
  try {
    const report = await prisma.catchReport.update({
      where: { id: reportId, verificationStatus: "PENDING" },
      data: { verificationStatus: "APPROVED" },
      select: {
        lureVariant: { select: { lureModel: { select: { slug: true } } } },
        fishSpecies: { select: { slug: true } },
      },
    });

    revalidateCatchReportPaths(
      report.lureVariant.lureModel.slug,
      report.fishSpecies.slug,
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not approve report" };
  }
}

export async function rejectCatchReport(
  reportId: string,
): Promise<CatchReportActionResult> {
  try {
    const slug = await getReportLureSlug(reportId);
    await prisma.catchReport.update({
      where: { id: reportId, verificationStatus: "PENDING" },
      data: { verificationStatus: "REJECTED" },
    });
    revalidateCatchReportPaths(slug);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reject report" };
  }
}

export async function mergeCatchReports(
  primaryId: string,
  duplicateId: string,
): Promise<CatchReportActionResult> {
  if (primaryId === duplicateId) {
    return { ok: false, error: "Cannot merge a report with itself" };
  }

  try {
    const [primary, duplicate] = await Promise.all([
      prisma.catchReport.findUnique({
        where: { id: primaryId },
        select: { id: true, verificationStatus: true, catchCount: true },
      }),
      prisma.catchReport.findUnique({
        where: { id: duplicateId },
        select: {
          id: true,
          verificationStatus: true,
          catchCount: true,
          mergedIntoId: true,
        },
      }),
    ]);

    if (!primary || !duplicate) {
      return { ok: false, error: "Report not found" };
    }
    if (duplicate.mergedIntoId) {
      return { ok: false, error: "Report already merged" };
    }

    await prisma.$transaction([
      prisma.catchReport.update({
        where: { id: primaryId },
        data: {
          catchCount: primary.catchCount + duplicate.catchCount,
          verificationStatus:
            primary.verificationStatus === "APPROVED" ? "APPROVED" : "PENDING",
        },
      }),
      prisma.catchReport.update({
        where: { id: duplicateId },
        data: {
          verificationStatus: "MERGED",
          mergedIntoId: primaryId,
        },
      }),
    ]);

    const slug = await getReportLureSlug(primaryId);
    revalidateCatchReportPaths(slug);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not merge reports" };
  }
}
