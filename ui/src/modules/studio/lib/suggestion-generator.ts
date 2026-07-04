import type {
  EditorNoteConfidence,
  Prisma,
  SuggestionKind,
  SuggestionSource,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { LURE_DETAIL_ENRICHMENTS } from "@/modules/lure/data/lure-detail-enrichment";
import {
  computeCompleteness,
  editorNoteHasMeaningfulContent,
} from "@/modules/studio/lib/completeness";

type SuggestionSeed = {
  kind: SuggestionKind;
  fieldKey: string | null;
  fieldLabel: string;
  currentValue: string | null;
  suggestedValue: string;
  confidence: EditorNoteConfidence;
  source: SuggestionSource;
  reasoning: string;
  provenance: Prisma.InputJsonValue;
};

const MODEL_FIELD_KEYS = new Set([
  "nameEn",
  "nameTr",
  "bodyTypeEn",
  "bodyTypeTr",
  "actionEn",
  "actionTr",
  "buoyancyEn",
  "buoyancyTr",
  "divingDepthMinM",
  "divingDepthMaxM",
  "coatingTypeEn",
  "coatingTypeTr",
  "shortDescriptionEn",
  "shortDescriptionTr",
]);

const EDITOR_NOTE_FIELD_KEYS = new Set([
  "currentRecommendationEn",
  "currentRecommendationTr",
  "shortRecommendationEn",
  "shortRecommendationTr",
  "mediterraneanNotesEn",
  "bestTargetSpeciesEn",
]);

export async function syncImportDiffSuggestions(
  lureModelId: string,
): Promise<number> {
  const pendingDiffs = await prisma.importFieldChange.findMany({
    where: { lureModelId, status: "PENDING" },
    include: { suggestion: true },
  });

  let created = 0;
  for (const diff of pendingDiffs) {
    if (diff.suggestion) continue;
    await prisma.catalogSuggestion.create({
      data: {
        lureModelId,
        kind: "FIELD_VALUE",
        fieldKey: diff.fieldKey,
        fieldLabel: diff.fieldLabel,
        currentValue: diff.oldValue,
        suggestedValue: diff.newValue,
        confidence: "HIGH",
        source: "IMPORTER",
        reasoning:
          "Manufacturer feed updated this field. Verify the new value matches the box and water experience.",
        provenance: {
          importFieldChangeId: diff.id,
          importBatchId: diff.importBatchId,
        },
        importFieldChangeId: diff.id,
      },
    });
    created += 1;
  }
  return created;
}

async function hasPendingSuggestion(
  lureModelId: string,
  fieldKey: string | null,
  source: SuggestionSource,
): Promise<boolean> {
  const existing = await prisma.catalogSuggestion.findFirst({
    where: {
      lureModelId,
      status: "PENDING",
      fieldKey,
      source,
    },
    select: { id: true },
  });
  return existing !== null;
}

function buildGapSuggestions(
  model: {
    id: string;
    slug: string;
    nameEn: string;
    nameTr: string;
    bodyTypeEn: string | null;
    actionEn: string | null;
    buoyancyEn: string | null;
    divingDepthMinM: { toString(): string } | null;
    divingDepthMaxM: { toString(): string } | null;
    images: { id: string; role: string }[];
    lureSpeciesLinks: { associationKind: string }[];
    editorNote: {
      shortRecommendationEn: string | null;
      currentRecommendationEn: string | null;
      mediterraneanNotesEn: string | null;
    } | null;
  },
): SuggestionSeed[] {
  const seeds: SuggestionSeed[] = [];
  const completeness = computeCompleteness({
    nameTr: model.nameTr,
    bodyTypeEn: model.bodyTypeEn,
    actionEn: model.actionEn,
    buoyancyEn: model.buoyancyEn,
    divingDepthMinM: model.divingDepthMinM?.toString() ?? null,
    divingDepthMaxM: model.divingDepthMaxM?.toString() ?? null,
    imageCount: model.images.length,
    hasCoverImage: model.images.some((i) => i.role === "HERO"),
    moderatorSpeciesCount: model.lureSpeciesLinks.filter(
      (l) => l.associationKind === "MODERATOR_CURATED",
    ).length,
    hasEditorNote: model.editorNote !== null,
    editorNoteHasContent: editorNoteHasMeaningfulContent(
      model.editorNote
        ? {
            ...model.editorNote,
            shortRecommendationTr: null,
            currentRecommendationTr: null,
            mediterraneanNotesTr: null,
            internalNotes: null,
          }
        : null,
    ),
  });

  if (completeness.issues.includes("missing_name_tr") && model.nameEn.trim()) {
    seeds.push({
      kind: "FIELD_VALUE",
      fieldKey: "nameTr",
      fieldLabel: "Turkish name",
      currentValue: model.nameTr || null,
      suggestedValue: model.nameEn,
      confidence: "LOW",
      source: "AI_ENRICHMENT",
      reasoning:
        "English name is present but Turkish name is missing. Draft translation from catalog name — verify with local anglers.",
      provenance: { generator: "completeness-gap", slug: model.slug },
    });
  }

  const enrichment = LURE_DETAIL_ENRICHMENTS[model.slug];
  if (enrichment) {
    if (completeness.issues.includes("missing_species")) {
      const communitySpecies = enrichment.recommendedSpecies?.filter(
        (s) => s.kind === "community",
      );
      for (const species of communitySpecies ?? []) {
        seeds.push({
          kind: "SPECIES_LINK",
          fieldKey: species.id,
          fieldLabel: "Target species (community)",
          currentValue: null,
          suggestedValue: species.name.en,
          confidence: "MEDIUM",
          source: "COMMUNITY_REPORT",
          reasoning: `${enrichment.communityStatistics.verifiedCatchReportCount} verified catch reports support this species link.`,
          provenance: {
            speciesSlug: species.id,
            catchReports: enrichment.communityStatistics.verifiedCatchReportCount,
            effectiveness: enrichment.communityStatistics.effectivenessBand,
          },
        });
      }
    }

    if (completeness.issues.includes("missing_editor_note")) {
      seeds.push({
        kind: "EDITOR_NOTE",
        fieldKey: "currentRecommendationEn",
        fieldLabel: "Current recommendation",
        currentValue: null,
        suggestedValue: enrichment.aiInsights.summary.en,
        confidence: "LOW",
        source: "AI_SUMMARY",
        reasoning: `AI summary from ${enrichment.aiInsights.corpusDate} corpus with ${enrichment.aiInsights.citations.length} citations.`,
        provenance: {
          corpusDate: enrichment.aiInsights.corpusDate,
          citations: enrichment.aiInsights.citations.length,
        },
      });
    }

    if (!model.images.some((i) => i.role === "HERO") && model.images[0]) {
      seeds.push({
        kind: "IMAGE_COVER",
        fieldKey: model.images[0].id,
        fieldLabel: "Cover image",
        currentValue: null,
        suggestedValue: model.images[0].id,
        confidence: "MEDIUM",
        source: "AI_ENRICHMENT",
        reasoning:
          "First gallery image proposed as cover — confirm it represents the product on the shelf.",
        provenance: { imageId: model.images[0].id },
      });
    }
  }

  return seeds;
}

export async function generateEnrichmentSuggestions(
  lureModelId: string,
): Promise<number> {
  const model = await prisma.lureModel.findFirst({
    where: { id: lureModelId, deletedAt: null },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameTr: true,
      bodyTypeEn: true,
      actionEn: true,
      buoyancyEn: true,
      divingDepthMinM: true,
      divingDepthMaxM: true,
      images: {
        where: { deletedAt: null },
        select: { id: true, role: true },
        orderBy: { sortOrder: "asc" },
      },
      lureSpeciesLinks: {
        where: { deletedAt: null },
        select: { associationKind: true },
      },
      editorNote: {
        select: {
          shortRecommendationEn: true,
          currentRecommendationEn: true,
          mediterraneanNotesEn: true,
        },
      },
    },
  });

  if (!model) return 0;

  const seeds = buildGapSuggestions(model);
  let created = 0;

  for (const seed of seeds) {
    if (await hasPendingSuggestion(model.id, seed.fieldKey, seed.source)) {
      continue;
    }
    await prisma.catalogSuggestion.create({
      data: {
        lureModelId: model.id,
        ...seed,
      },
    });
    created += 1;
  }

  return created;
}

export async function ensureProductSuggestions(
  lureModelId: string,
): Promise<void> {
  await syncImportDiffSuggestions(lureModelId);
  await generateEnrichmentSuggestions(lureModelId);
}

export async function ensureAttentionSuggestions(limit = 40): Promise<void> {
  const candidates = await prisma.lureModel.findMany({
    where: {
      deletedAt: null,
      lifecycleState: { in: ["PENDING_REVIEW", "READY", "DRAFT"] },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true },
  });

  for (const { id } of candidates) {
    await ensureProductSuggestions(id);
  }
}

export function isModelFieldKey(fieldKey: string | null): boolean {
  return fieldKey !== null && MODEL_FIELD_KEYS.has(fieldKey);
}

export function isEditorNoteFieldKey(fieldKey: string | null): boolean {
  return fieldKey !== null && EDITOR_NOTE_FIELD_KEYS.has(fieldKey);
}
