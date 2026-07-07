"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { runAiReviewAnalysis } from "@/modules/studio/ai-review/actions/ai-review-actions";

type CatchReportAiReviewButtonProps = {
  reportId: string;
  techniqueId: string | null;
};

export function CatchReportAiReviewButton({
  reportId,
  techniqueId,
}: CatchReportAiReviewButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function analyze() {
    startTransition(async () => {
      await runAiReviewAnalysis(
        "CATCH_REPORT",
        { reportId, techniqueId: techniqueId ?? undefined },
        reportId,
      );
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={analyze}>
      AI review
    </Button>
  );
}
