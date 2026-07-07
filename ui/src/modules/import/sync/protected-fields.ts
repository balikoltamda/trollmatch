import type { PrismaClient } from "@/generated/prisma/client";

/** Model fields that must never be overwritten — conflicts become AI suggestions. */
export const PROTECTED_MODEL_FIELDS = new Set([
  "shortDescriptionEn",
  "shortDescriptionTr",
  "seoTitleEn",
  "seoTitleTr",
  "metaDescriptionEn",
  "metaDescriptionTr",
  "openGraphTitleEn",
  "openGraphTitleTr",
  "openGraphDescriptionEn",
  "openGraphDescriptionTr",
]);

export const PROTECTED_SYNC_PREFIXES = [
  "sync:rel:technique:",
  "sync:rel:species:",
] as const;

export function isProtectedFieldKey(fieldKey: string): boolean {
  if (PROTECTED_MODEL_FIELDS.has(fieldKey)) return true;
  if (fieldKey.startsWith("seo:")) return true;
  return PROTECTED_SYNC_PREFIXES.some((prefix) => fieldKey.startsWith(prefix));
}

export function classifyChangeKind(input: {
  oldValue: string | null;
  newValue: string | null;
}): "ADDED" | "UPDATED" | "REMOVED" | "UNCHANGED" {
  const had = Boolean(input.oldValue?.trim());
  const has = Boolean(input.newValue?.trim());
  if (!had && has) return "ADDED";
  if (had && !has) return "REMOVED";
  if (had && has && input.oldValue !== input.newValue) return "UPDATED";
  return "UNCHANGED";
}

type ProtectedConflict = {
  fieldKey: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
};

/** Route protected manufacturer conflicts to catalog suggestions instead of direct apply. */
export async function createProtectedFieldSuggestions(
  prisma: PrismaClient,
  lureModelId: string,
  conflicts: ProtectedConflict[],
): Promise<number> {
  if (conflicts.length === 0) return 0;

  let created = 0;
  for (const conflict of conflicts) {
    if (!conflict.newValue?.trim()) continue;

    const existing = await prisma.catalogSuggestion.findFirst({
      where: {
        lureModelId,
        fieldKey: conflict.fieldKey,
        status: "PENDING",
        source: "IMPORTER",
      },
    });
    if (existing) continue;

    await prisma.catalogSuggestion.create({
      data: {
        lureModelId,
        kind: "FIELD_VALUE",
        fieldKey: conflict.fieldKey.slice(0, 64),
        fieldLabel: conflict.fieldLabel.slice(0, 128),
        currentValue: conflict.oldValue,
        suggestedValue: conflict.newValue,
        confidence: "MEDIUM",
        source: "IMPORTER",
        reasoning:
          "Manufacturer page differs from editor-approved value — review before applying.",
        provenance: { protectedField: true },
      },
    });
    created += 1;
  }

  return created;
}

export async function productHasEditorHero(
  prisma: PrismaClient,
  lureModelId: string,
): Promise<boolean> {
  const hero = await prisma.image.findFirst({
    where: { lureModelId, role: "HERO", deletedAt: null },
  });
  return hero !== null;
}
