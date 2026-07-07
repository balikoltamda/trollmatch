"use client";

import { Badge } from "@/components/ui/badge";
import type { AiReviewStatusSummary } from "@/modules/studio/ai-review/types";

type AiReviewStatusBarProps = {
  summary: AiReviewStatusSummary;
};

export function AiReviewStatusBar({ summary }: AiReviewStatusBarProps) {
  if (summary.total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground font-medium">AI review</span>
      <Badge variant="coral">{summary.pending} pending</Badge>
      <Badge variant="ocean">{summary.approved} accepted</Badge>
      <Badge variant="muted">{summary.rejected} rejected</Badge>
    </div>
  );
}
