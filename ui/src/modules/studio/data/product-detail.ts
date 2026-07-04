import { prisma } from "@/lib/prisma";
import { listProductSuggestions } from "@/modules/studio/data/attention-inbox";
import {
  computeCompleteness,
  editorNoteHasMeaningfulContent,
} from "@/modules/studio/lib/completeness";
import {
  EMPTY_EDITOR_NOTE,
  type EditorNoteForm,
  type ProductEditorData,
} from "@/modules/studio/types";

function decimalToString(value: { toString(): string } | null): string | null {
  return value ? value.toString() : null;
}

function mapEditorNote(
  note: {
    shortRecommendationEn: string | null;
    shortRecommendationTr: string | null;
    longRecommendationEn: string | null;
    longRecommendationTr: string | null;
    currentRecommendationEn: string | null;
    currentRecommendationTr: string | null;
    mediterraneanNotesEn: string | null;
    mediterraneanNotesTr: string | null;
    aegeanNotesEn: string | null;
    aegeanNotesTr: string | null;
    northernCyprusNotesEn: string | null;
    northernCyprusNotesTr: string | null;
    seasonalityEn: string | null;
    seasonalityTr: string | null;
    weatherEn: string | null;
    weatherTr: string | null;
    waterClarityEn: string | null;
    waterClarityTr: string | null;
    retrieveSpeedEn: string | null;
    retrieveSpeedTr: string | null;
    bestTargetSpeciesEn: string | null;
    bestTargetSpeciesTr: string | null;
    personalObservationsEn: string | null;
    personalObservationsTr: string | null;
    recommendedRetrieveEn: string | null;
    recommendedRetrieveTr: string | null;
    warningsEn: string | null;
    warningsTr: string | null;
    bestColorsEn: string | null;
    bestColorsTr: string | null;
    confidence: EditorNoteForm["confidence"];
    internalNotes: string | null;
  } | null,
): EditorNoteForm | null {
  if (!note) return null;
  return {
    shortRecommendationEn: note.shortRecommendationEn ?? "",
    shortRecommendationTr: note.shortRecommendationTr ?? "",
    longRecommendationEn: note.longRecommendationEn ?? "",
    longRecommendationTr: note.longRecommendationTr ?? "",
    currentRecommendationEn: note.currentRecommendationEn ?? "",
    currentRecommendationTr: note.currentRecommendationTr ?? "",
    mediterraneanNotesEn: note.mediterraneanNotesEn ?? "",
    mediterraneanNotesTr: note.mediterraneanNotesTr ?? "",
    aegeanNotesEn: note.aegeanNotesEn ?? "",
    aegeanNotesTr: note.aegeanNotesTr ?? "",
    northernCyprusNotesEn: note.northernCyprusNotesEn ?? "",
    northernCyprusNotesTr: note.northernCyprusNotesTr ?? "",
    seasonalityEn: note.seasonalityEn ?? "",
    seasonalityTr: note.seasonalityTr ?? "",
    weatherEn: note.weatherEn ?? "",
    weatherTr: note.weatherTr ?? "",
    waterClarityEn: note.waterClarityEn ?? "",
    waterClarityTr: note.waterClarityTr ?? "",
    retrieveSpeedEn: note.retrieveSpeedEn ?? "",
    retrieveSpeedTr: note.retrieveSpeedTr ?? "",
    bestTargetSpeciesEn: note.bestTargetSpeciesEn ?? "",
    bestTargetSpeciesTr: note.bestTargetSpeciesTr ?? "",
    personalObservationsEn: note.personalObservationsEn ?? "",
    personalObservationsTr: note.personalObservationsTr ?? "",
    recommendedRetrieveEn: note.recommendedRetrieveEn ?? "",
    recommendedRetrieveTr: note.recommendedRetrieveTr ?? "",
    warningsEn: note.warningsEn ?? "",
    warningsTr: note.warningsTr ?? "",
    bestColorsEn: note.bestColorsEn ?? "",
    bestColorsTr: note.bestColorsTr ?? "",
    confidence: note.confidence,
    internalNotes: note.internalNotes ?? "",
  };
}

export async function getProductEditorData(
  id: string,
): Promise<ProductEditorData | null> {
  const model = await prisma.lureModel.findFirst({
    where: { id, deletedAt: null },
    include: {
      manufacturer: true,
      productLine: true,
      lureTechniques: {
        where: { deletedAt: null },
        include: { technique: true },
      },
      lureSpeciesLinks: {
        where: { deletedAt: null },
        include: { fishSpecies: true },
      },
      images: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      aliases: { where: { deletedAt: null }, take: 20 },
      editorNote: true,
      auditEntries: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      importFieldChanges: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!model) return null;

  const suggestions = await listProductSuggestions(id);

  const hasCover = model.images.some((img) => img.role === "HERO");
  const moderatorSpecies = model.lureSpeciesLinks.filter(
    (l) => l.associationKind === "MODERATOR_CURATED",
  );
  const completeness = computeCompleteness({
    nameTr: model.nameTr,
    bodyTypeEn: model.bodyTypeEn,
    actionEn: model.actionEn,
    buoyancyEn: model.buoyancyEn,
    divingDepthMinM: decimalToString(model.divingDepthMinM),
    divingDepthMaxM: decimalToString(model.divingDepthMaxM),
    imageCount: model.images.length,
    hasCoverImage: hasCover,
    moderatorSpeciesCount: moderatorSpecies.length,
    hasEditorNote: model.editorNote !== null,
    editorNoteHasContent: editorNoteHasMeaningfulContent(model.editorNote),
  });

  return {
    id: model.id,
    slug: model.slug,
    nameEn: model.nameEn,
    nameTr: model.nameTr,
    lifecycleState: model.lifecycleState,
    manufacturerStatus: model.manufacturerStatus,
    formFactorEn: model.formFactorEn,
    formFactorTr: model.formFactorTr,
    bodyTypeSlug: model.bodyTypeSlug,
    bodyTypeEn: model.bodyTypeEn,
    bodyTypeTr: model.bodyTypeTr,
    coatingTypeSlug: model.coatingTypeSlug,
    coatingTypeEn: model.coatingTypeEn,
    coatingTypeTr: model.coatingTypeTr,
    buoyancySlug: model.buoyancySlug,
    buoyancyEn: model.buoyancyEn,
    buoyancyTr: model.buoyancyTr,
    actionSlug: model.actionSlug,
    actionEn: model.actionEn,
    actionTr: model.actionTr,
    divingDepthMinM: decimalToString(model.divingDepthMinM),
    divingDepthMaxM: decimalToString(model.divingDepthMaxM),
    trollingSpeedMinKn: decimalToString(model.trollingSpeedMinKn),
    trollingSpeedMaxKn: decimalToString(model.trollingSpeedMaxKn),
    shortDescriptionEn: model.shortDescriptionEn,
    shortDescriptionTr: model.shortDescriptionTr,
    firstSeenAt: model.firstSeenAt,
    lastSeenAt: model.lastSeenAt,
    lastImportedAt: model.lastImportedAt,
    missingImportCount: model.missingImportCount,
    manufacturer: {
      id: model.manufacturer.id,
      slug: model.manufacturer.slug,
      nameEn: model.manufacturer.nameEn,
      nameTr: model.manufacturer.nameTr,
      countryCode: model.manufacturer.countryCode,
    },
    productLine: {
      slug: model.productLine.slug,
      nameEn: model.productLine.nameEn,
      nameTr: model.productLine.nameTr,
    },
    techniques: model.lureTechniques.map((link) => ({
      id: link.technique.id,
      slug: link.technique.slug,
      nameEn: link.technique.nameEn,
    })),
    species: model.lureSpeciesLinks.map((link) => ({
      id: link.fishSpecies.id,
      slug: link.fishSpecies.slug,
      nameEn: link.fishSpecies.nameEn,
      associationKind: link.associationKind,
    })),
    images: model.images.map((img) => ({
      id: img.id,
      url: img.url,
      role: img.role,
      sortOrder: img.sortOrder,
    })),
    aliases: model.aliases.map((a) => ({ alias: a.alias, kind: a.kind })),
    editorNote: mapEditorNote(model.editorNote) ?? EMPTY_EDITOR_NOTE,
    auditEntries: model.auditEntries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actor: entry.actor,
      summary: entry.summary,
      createdAt: entry.createdAt,
    })),
    pendingImportDiffs: model.importFieldChanges.map((diff) => ({
      id: diff.id,
      fieldLabel: diff.fieldLabel,
      fieldKey: diff.fieldKey,
      oldValue: diff.oldValue,
      newValue: diff.newValue,
      status: diff.status,
      createdAt: diff.createdAt,
    })),
    pendingSuggestions: suggestions.map((s) => ({
      id: s.id,
      kind: s.kind,
      fieldLabel: s.fieldLabel,
      fieldKey: s.fieldKey,
      currentValue: s.currentValue,
      suggestedValue: s.suggestedValue,
      confidence: s.confidence,
      source: s.source,
      reasoning: s.reasoning,
      provenance:
        s.provenance && typeof s.provenance === "object"
          ? (s.provenance as Record<string, unknown>)
          : null,
    })),
    completeness: {
      score: completeness.score,
      missing: completeness.missing,
    },
  };
}

export async function listTechniqueOptions() {
  return prisma.technique.findMany({
    where: { deletedAt: null },
    orderBy: { nameEn: "asc" },
    select: { id: true, slug: true, nameEn: true },
  });
}

export async function listSpeciesOptions() {
  return prisma.fishSpecies.findMany({
    where: { deletedAt: null },
    orderBy: { nameEn: "asc" },
    select: { id: true, slug: true, nameEn: true },
    take: 200,
  });
}
