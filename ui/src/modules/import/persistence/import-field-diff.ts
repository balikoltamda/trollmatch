import type { Prisma } from "@/generated/prisma/client";

type ImportDiffTx = {
  importFieldChange: Prisma.TransactionClient["importFieldChange"];
};

export const IMPORT_FIELD_LABELS: Record<string, string> = {
  nameEn: "Name (EN)",
  nameTr: "Name (TR)",
  formFactorEn: "Form factor (EN)",
  formFactorTr: "Form factor (TR)",
  bodyTypeSlug: "Body type slug",
  bodyTypeEn: "Body type (EN)",
  bodyTypeTr: "Body type (TR)",
  buoyancySlug: "Buoyancy slug",
  buoyancyEn: "Buoyancy (EN)",
  buoyancyTr: "Buoyancy (TR)",
  divingDepthMinM: "Dive depth min (m)",
  divingDepthMaxM: "Dive depth max (m)",
  trollingSpeedMinKn: "Trolling speed min (kn)",
  trollingSpeedMaxKn: "Trolling speed max (kn)",
  coatingTypeSlug: "Coating slug",
  coatingTypeEn: "Coating (EN)",
  coatingTypeTr: "Coating (TR)",
  actionSlug: "Action slug",
  actionEn: "Action (EN)",
  actionTr: "Action (TR)",
  shortDescriptionEn: "Short description (EN)",
  shortDescriptionTr: "Short description (TR)",
};

function valueToString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && value !== null && "toString" in value) {
    return (value as { toString(): string }).toString();
  }
  return String(value);
}

export async function recordImportFieldChanges(
  tx: ImportDiffTx,
  lureModelId: string,
  importBatchId: string | null,
  before: Record<string, unknown>,
  changedFields: Record<string, unknown>,
): Promise<void> {
  const entries = Object.entries(changedFields);
  if (entries.length === 0) return;

  await tx.importFieldChange.createMany({
    data: entries.map(([fieldKey, newValue]) => ({
      lureModelId,
      importBatchId,
      fieldKey,
      fieldLabel: IMPORT_FIELD_LABELS[fieldKey] ?? fieldKey,
      oldValue: valueToString(before[fieldKey]),
      newValue: valueToString(newValue),
      status: "PENDING" as const,
    })),
  });
}
