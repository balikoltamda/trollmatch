import type { PrismaClient } from "@/generated/prisma/client";
import type { CanonicalLureImport } from "@/modules/import/core/canonical-lure";
import { generateEditorialProse } from "@/modules/import/enrichment/editorial-prose";
import { resolveLocalized } from "@/modules/import/persistence/normalize";
import { generateLongDescriptionDraft } from "@/modules/import/sync/refresh-manufacturer-product";

export type ContentGenerationResult = {
  filledFields: string[];
};

type ModelContentFields = {
  shortDescriptionEn: string | null;
  shortDescriptionTr: string | null;
  seoTitleEn: string | null;
  seoTitleTr: string | null;
  metaDescriptionEn: string | null;
  metaDescriptionTr: string | null;
  openGraphTitleEn: string | null;
  openGraphTitleTr: string | null;
  openGraphDescriptionEn: string | null;
  openGraphDescriptionTr: string | null;
};

type EditorNoteFields = {
  longRecommendationEn: string | null;
  longRecommendationTr: string | null;
};

function buildSeoDrafts(
  record: CanonicalLureImport,
  prose: { en: string; tr: string },
) {
  const nameEn = resolveLocalized(record.model.name, "en");
  const nameTr = resolveLocalized(record.model.name, "tr") || nameEn;

  return {
    seoTitleEn: nameEn,
    seoTitleTr: nameTr,
    metaDescriptionEn: prose.en || nameEn,
    metaDescriptionTr: prose.tr || nameTr,
    openGraphTitleEn: nameEn,
    openGraphTitleTr: nameTr,
    openGraphDescriptionEn: prose.en || nameEn,
    openGraphDescriptionTr: prose.tr || nameTr,
  };
}

/**
 * Generate editorial drafts for empty content fields from structured manufacturer data.
 * Never hallucinates specifications — uses parsed canonical fields only.
 */
export async function generateMissingProductContent(
  prisma: PrismaClient,
  lureModelId: string,
  incoming: CanonicalLureImport,
  existing: ModelContentFields & { editorNote: EditorNoteFields | null },
): Promise<ContentGenerationResult> {
  const filledFields: string[] = [];
  const prose = generateEditorialProse(incoming);
  const seo = buildSeoDrafts(incoming, {
    en: prose.en ?? "",
    tr: prose.tr ?? "",
  });
  const longDraft = generateLongDescriptionDraft(incoming);

  const modelUpdates: Record<string, string> = {};
  const assignIfEmpty = (
    key: keyof ModelContentFields,
    value: string | undefined,
  ) => {
    if (!value?.trim()) return;
    const current = existing[key];
    if (current?.trim()) return;
    modelUpdates[key] = value.trim();
    filledFields.push(key);
  };

  assignIfEmpty("shortDescriptionEn", prose.en);
  assignIfEmpty("shortDescriptionTr", prose.tr);
  assignIfEmpty("seoTitleEn", seo.seoTitleEn);
  assignIfEmpty("seoTitleTr", seo.seoTitleTr);
  assignIfEmpty("metaDescriptionEn", seo.metaDescriptionEn);
  assignIfEmpty("metaDescriptionTr", seo.metaDescriptionTr);
  assignIfEmpty("openGraphTitleEn", seo.openGraphTitleEn);
  assignIfEmpty("openGraphTitleTr", seo.openGraphTitleTr);
  assignIfEmpty("openGraphDescriptionEn", seo.openGraphDescriptionEn);
  assignIfEmpty("openGraphDescriptionTr", seo.openGraphDescriptionTr);

  if (Object.keys(modelUpdates).length > 0) {
    await prisma.lureModel.update({
      where: { id: lureModelId },
      data: modelUpdates,
    });
  }

  const noteUpdates: Record<string, string> = {};
  if (!existing.editorNote?.longRecommendationEn?.trim() && longDraft.en) {
    noteUpdates.longRecommendationEn = longDraft.en;
    filledFields.push("longRecommendationEn");
  }
  if (!existing.editorNote?.longRecommendationTr?.trim() && longDraft.tr) {
    noteUpdates.longRecommendationTr = longDraft.tr;
    filledFields.push("longRecommendationTr");
  }

  if (Object.keys(noteUpdates).length > 0) {
    await prisma.lureEditorNote.upsert({
      where: { lureModelId },
      create: { lureModelId, ...noteUpdates, confidence: "MEDIUM" },
      update: noteUpdates,
    });
  }

  return { filledFields };
}
