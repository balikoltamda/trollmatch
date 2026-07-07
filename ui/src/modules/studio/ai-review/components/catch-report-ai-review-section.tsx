"use client";

import { AiReviewPanel } from "@/modules/studio/ai-review/components/ai-review-panel";
import { CatchReportAiReviewButton } from "@/modules/studio/ai-review/components/catch-report-ai-review-button";
import type { AiReviewSessionView } from "@/modules/studio/ai-review/types";

type CatchReportAiReviewSectionProps = {
  reportId: string;
  techniqueId: string | null;
  session: AiReviewSessionView | null;
};

export function CatchReportAiReviewSection({
  reportId,
  techniqueId,
  session,
}: CatchReportAiReviewSectionProps) {
  return (
    <div className="border-border/60 mt-4 space-y-3 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          AI validation
        </p>
        <CatchReportAiReviewButton reportId={reportId} techniqueId={techniqueId} />
      </div>
      <AiReviewPanel session={session} readOnly={false} />
    </div>
  );
}
