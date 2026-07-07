"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioField,
  StudioInput,
} from "@/modules/studio/components/studio-ui";
import { runAiReviewAnalysis } from "@/modules/studio/ai-review/actions/ai-review-actions";
import type { StudioReviewEntityType } from "@/generated/prisma/client";

type AiSeedAnalyzeFormProps = {
  entityType: StudioReviewEntityType;
  entityId?: string | null;
  onAnalyzed?: (sessionId: string) => void;
};

export function AiSeedAnalyzeForm({
  entityType,
  entityId,
  onAnalyzed,
}: AiSeedAnalyzeFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [nameTr, setNameTr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [scientificName, setScientificName] = useState("");

  function analyze() {
    startTransition(async () => {
      setMessage(null);
      const result = await runAiReviewAnalysis(
        entityType,
        { nameTr, nameEn, scientificName },
        entityId,
      );
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(
        `Generated ${result.suggestionCount} suggestion(s)${
          result.duplicateCount > 0
            ? ` — ${result.duplicateCount} possible duplicate(s) flagged`
            : ""
        }.`,
      );
      onAnalyzed?.(result.sessionId);
      router.refresh();
    });
  }

  return (
    <section className="border-border space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="text-sm font-semibold">AI-assisted seed</h2>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Enter one name only — Turkish preferred, English preferred, or scientific.
          AI will suggest fields for your review. Nothing is saved until you accept and save.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StudioField label="Preferred Turkish name">
          <StudioInput
            value={nameTr}
            onChange={(e) => setNameTr(e.target.value)}
            placeholder="e.g. Akya"
          />
        </StudioField>
        <StudioField label="Preferred English name">
          <StudioInput
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="e.g. Leerfish"
          />
        </StudioField>
        <StudioField label="Scientific name">
          <StudioInput
            value={scientificName}
            onChange={(e) => setScientificName(e.target.value)}
            placeholder="e.g. Lichia amia"
            className="italic"
          />
        </StudioField>
      </div>
      <button
        type="button"
        disabled={pending}
        className={buttonVariants({ size: "sm" })}
        onClick={analyze}
      >
        {pending ? "Analyzing…" : "Analyze with AI"}
      </button>
      {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}
    </section>
  );
}
