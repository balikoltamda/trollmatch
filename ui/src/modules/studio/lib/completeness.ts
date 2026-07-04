export type CompletenessIssue =
  | "missing_name_tr"
  | "missing_images"
  | "missing_cover"
  | "missing_fishing_attributes"
  | "missing_species"
  | "missing_editor_note";

export type CompletenessInput = {
  nameTr: string | null;
  bodyTypeEn: string | null;
  actionEn: string | null;
  buoyancyEn: string | null;
  divingDepthMinM: string | null;
  divingDepthMaxM: string | null;
  imageCount: number;
  hasCoverImage: boolean;
  moderatorSpeciesCount: number;
  hasEditorNote: boolean;
  editorNoteHasContent: boolean;
};

export type CompletenessResult = {
  score: number;
  issues: CompletenessIssue[];
  missing: string[];
};

const WEIGHTS = {
  nameTr: 15,
  images: 15,
  cover: 15,
  fishingAttributes: 25,
  species: 15,
  editorNote: 15,
} as const;

const ISSUE_LABELS: Record<CompletenessIssue, string> = {
  missing_name_tr: "Turkish name",
  missing_images: "Images",
  missing_cover: "Cover image",
  missing_fishing_attributes: "Fishing attributes",
  missing_species: "Target species",
  missing_editor_note: "Editor note",
};

function hasFishingAttributes(input: CompletenessInput): boolean {
  const hasDepth =
    Boolean(input.divingDepthMinM?.trim()) ||
    Boolean(input.divingDepthMaxM?.trim());
  return (
    Boolean(input.bodyTypeEn?.trim()) &&
    Boolean(input.actionEn?.trim()) &&
    Boolean(input.buoyancyEn?.trim()) &&
    hasDepth
  );
}

export function computeCompleteness(
  input: CompletenessInput,
): CompletenessResult {
  let score = 0;
  const issues: CompletenessIssue[] = [];
  const missing: string[] = [];

  if (input.nameTr?.trim()) {
    score += WEIGHTS.nameTr;
  } else {
    issues.push("missing_name_tr");
    missing.push(ISSUE_LABELS.missing_name_tr);
  }

  if (input.imageCount > 0) {
    score += WEIGHTS.images;
  } else {
    issues.push("missing_images");
    missing.push(ISSUE_LABELS.missing_images);
  }

  if (input.hasCoverImage) {
    score += WEIGHTS.cover;
  } else {
    issues.push("missing_cover");
    missing.push(ISSUE_LABELS.missing_cover);
  }

  if (hasFishingAttributes(input)) {
    score += WEIGHTS.fishingAttributes;
  } else {
    issues.push("missing_fishing_attributes");
    missing.push(ISSUE_LABELS.missing_fishing_attributes);
  }

  if (input.moderatorSpeciesCount > 0) {
    score += WEIGHTS.species;
  } else {
    issues.push("missing_species");
    missing.push(ISSUE_LABELS.missing_species);
  }

  if (input.hasEditorNote && input.editorNoteHasContent) {
    score += WEIGHTS.editorNote;
  } else {
    issues.push("missing_editor_note");
    missing.push(ISSUE_LABELS.missing_editor_note);
  }

  return { score, issues, missing };
}

export function editorNoteHasMeaningfulContent(note: {
  shortRecommendationEn: string | null;
  shortRecommendationTr: string | null;
  currentRecommendationEn: string | null;
  currentRecommendationTr: string | null;
  mediterraneanNotesEn: string | null;
  mediterraneanNotesTr: string | null;
  internalNotes: string | null;
} | null): boolean {
  if (!note) return false;
  const fields = [
    note.shortRecommendationEn,
    note.shortRecommendationTr,
    note.currentRecommendationEn,
    note.currentRecommendationTr,
    note.mediterraneanNotesEn,
    note.mediterraneanNotesTr,
    note.internalNotes,
  ];
  return fields.some((f) => Boolean(f?.trim()));
}
