"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioField,
  StudioInput,
} from "@/modules/studio/components/studio-ui";
import {
  AiReviewPanel,
  DuplicateWarningBanner,
  extractDuplicatesFromSession,
} from "@/modules/studio/ai-review";
import { runAiReviewAnalysis } from "@/modules/studio/ai-review/actions/ai-review-actions";
import type { AiReviewSessionView } from "@/modules/studio/ai-review/types";

type TechniqueAiReviewSectionProps = {
  session: AiReviewSessionView | null;
};

export function TechniqueAiReviewSection({ session: initialSession }: TechniqueAiReviewSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nameTr, setNameTr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const session = initialSession;
  const duplicates = session
    ? extractDuplicatesFromSession(session.suggestions)
    : [];

  function analyze() {
    startTransition(async () => {
      const result = await runAiReviewAnalysis("TECHNIQUE", { nameTr, nameEn });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(`Generated ${result.suggestionCount} suggestion(s).`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="border-border space-y-4 rounded-xl border p-4">
        <h2 className="text-sm font-semibold">Technique seed</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StudioField label="Name (TR)">
            <StudioInput value={nameTr} onChange={(e) => setNameTr(e.target.value)} />
          </StudioField>
          <StudioField label="Name (EN)">
            <StudioInput value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </StudioField>
        </div>
        <button
          type="button"
          disabled={pending}
          className={buttonVariants({ size: "sm" })}
          onClick={analyze}
        >
          Analyze with AI
        </button>
        {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}
      </section>
      <DuplicateWarningBanner duplicates={duplicates} />
      <AiReviewPanel session={session} />
    </div>
  );
}
