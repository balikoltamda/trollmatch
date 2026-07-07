"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { StudioField, StudioInput } from "@/modules/studio/components/studio-ui";
import { AiReviewPanel } from "@/modules/studio/ai-review/components/ai-review-panel";
import { runAiReviewAnalysis } from "@/modules/studio/ai-review/actions/ai-review-actions";
import type { AiReviewSessionView } from "@/modules/studio/ai-review/types";
import type { StudioReviewEntityType } from "@/generated/prisma/client";

type EntityAiReviewMiniProps = {
  entityType: StudioReviewEntityType;
  entityId?: string | null;
  session: AiReviewSessionView | null;
  label?: string;
};

export function EntityAiReviewMini({
  entityType,
  entityId,
  session,
  label = "Seed name",
}: EntityAiReviewMiniProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [seed, setSeed] = useState("");

  function analyze() {
    startTransition(async () => {
      await runAiReviewAnalysis(
        entityType,
        entityType === "KNOWLEDGE_SOURCE"
          ? { title: seed, url: seed.startsWith("http") ? seed : undefined }
          : { nameEn: seed },
        entityId,
      );
      router.refresh();
    });
  }

  return (
    <section className="border-border mt-6 space-y-4 rounded-xl border p-4">
      <h2 className="text-sm font-semibold">AI review</h2>
      <p className="text-muted-foreground text-xs">
        AI suggests — you verify. Accepting a suggestion never publishes automatically.
      </p>
      <StudioField label={label}>
        <StudioInput value={seed} onChange={(e) => setSeed(e.target.value)} />
      </StudioField>
      <button
        type="button"
        disabled={pending}
        className={buttonVariants({ size: "sm", variant: "outline" })}
        onClick={analyze}
      >
        Analyze with AI
      </button>
      <AiReviewPanel session={session} />
    </section>
  );
}
