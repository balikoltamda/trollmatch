import type { Dispatch, SetStateAction } from "react";
import type { DuplicateMatch } from "@/modules/studio/ai-review/types";

type SpeciesFormPatchContext = {
  setCore: Dispatch<SetStateAction<Record<string, string>>>;
  setProfile: Dispatch<SetStateAction<Record<string, string>>>;
  setEditorNote: Dispatch<SetStateAction<Record<string, string>>>;
  setAliases: Dispatch<SetStateAction<Array<{ alias: string; kind: string }>>>;
  setConfusions: Dispatch<SetStateAction<Array<Record<string, string>>>>;
  setRegionIds: Dispatch<SetStateAction<string[]>>;
  regionCodeToId: Map<string, string>;
};

/** Apply an accepted AI suggestion value into species editor form state. */
export function applySpeciesAiSuggestion(
  fieldKey: string,
  value: string,
  ctx: SpeciesFormPatchContext,
): void {
  const coreKeys = new Set([
    "scientificName",
    "nameEn",
    "nameTr",
    "slugEn",
    "slugTr",
  ]);
  const profileKeys = new Set([
    "descriptionEn",
    "descriptionTr",
    "habitatEn",
    "habitatTr",
    "maxLengthCm",
    "maxWeightG",
    "depthMinM",
    "depthMaxM",
    "iucnStatus",
  ]);

  if (fieldKey.startsWith("editorNote.")) {
    const noteKey = fieldKey.replace("editorNote.", "");
    ctx.setEditorNote((prev) => ({ ...prev, [noteKey]: value }));
    return;
  }

  if (fieldKey === "aliases") {
    try {
      const parsed = JSON.parse(value) as Array<{ alias: string; kind: string }>;
      ctx.setAliases(() =>
        parsed.map((row) => ({
          alias: row.alias,
          kind: row.kind as "SEARCH_TERM",
        })),
      );
    } catch {
      /* ignore malformed */
    }
    return;
  }

  if (fieldKey === "speciesConfusion") {
    try {
      const parsed = JSON.parse(value) as Record<string, string>;
      if (parsed.confusedWithSpeciesId) {
        ctx.setConfusions((prev) => [
          ...prev,
          {
            confusedWithSpeciesId: parsed.confusedWithSpeciesId,
            misappliedNameEn: parsed.misappliedNameEn ?? "",
            misappliedNameTr: parsed.misappliedNameTr ?? "",
            reasonEn: parsed.reasonEn ?? "",
            reasonTr: parsed.reasonTr ?? "",
          },
        ]);
      }
    } catch {
      /* ignore */
    }
    return;
  }

  if (fieldKey === "regionIds") {
    try {
      const codes = JSON.parse(value) as string[];
      const ids = codes
        .map((code) => ctx.regionCodeToId.get(code))
        .filter(Boolean) as string[];
      ctx.setRegionIds(() => ids);
    } catch {
      /* ignore */
    }
    return;
  }

  if (coreKeys.has(fieldKey)) {
    ctx.setCore((prev) => ({ ...prev, [fieldKey]: value }));
    return;
  }

  if (profileKeys.has(fieldKey)) {
    ctx.setProfile((prev) => ({ ...prev, [fieldKey]: value }));
  }
}

export function extractDuplicatesFromSession(
  suggestions: Array<{ fieldKey: string; suggestedValue: string; status: string }>,
): DuplicateMatch[] {
  const row = suggestions.find(
    (s) => s.fieldKey === "duplicateWarning" && s.status === "PENDING",
  );
  if (!row) return [];
  try {
    return JSON.parse(row.suggestedValue) as DuplicateMatch[];
  } catch {
    return [];
  }
}
