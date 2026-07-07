"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  AiReviewPanel,
  AiSeedAnalyzeForm,
  DuplicateWarningBanner,
  applySpeciesAiSuggestion,
  extractDuplicatesFromSession,
} from "@/modules/studio/ai-review";
import type { AiReviewSessionView } from "@/modules/studio/ai-review/types";

type SpeciesFormSetters = {
  setCore: Dispatch<SetStateAction<Record<string, string>>>;
  setProfile: Dispatch<SetStateAction<Record<string, string>>>;
  setEditorNote: Dispatch<SetStateAction<Record<string, string>>>;
  setAliases: Dispatch<SetStateAction<Array<{ alias: string; kind: string }>>>;
  setConfusions: Dispatch<SetStateAction<Array<Record<string, string>>>>;
  setRegionIds: Dispatch<SetStateAction<string[]>>;
};

type SpeciesAiReviewSectionProps = SpeciesFormSetters & {
  session: AiReviewSessionView | null;
  entityId?: string | null;
  regionCodeToId: Record<string, string>;
};

export function SpeciesAiReviewSection({
  session,
  entityId,
  regionCodeToId,
  setCore,
  setProfile,
  setEditorNote,
  setAliases,
  setConfusions,
  setRegionIds,
}: SpeciesAiReviewSectionProps) {
  const duplicates = session
    ? extractDuplicatesFromSession(session.suggestions)
    : [];

  function handleAccepted(fieldKey: string, value: string) {
    applySpeciesAiSuggestion(fieldKey, value, {
      setCore,
      setProfile,
      setEditorNote,
      setAliases,
      setConfusions,
      setRegionIds,
      regionCodeToId: new Map(Object.entries(regionCodeToId)),
    });
  }

  return (
    <div className="space-y-6">
      <AiSeedAnalyzeForm entityType="SPECIES" entityId={entityId} />
      <DuplicateWarningBanner duplicates={duplicates} />
      <AiReviewPanel session={session} onAccepted={handleAccepted} />
    </div>
  );
}
