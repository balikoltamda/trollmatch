"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  approveCatchReport,
  mergeCatchReports,
  rejectCatchReport,
} from "@/modules/catch-report/actions/catch-report-actions";
import type { CatchReportReviewRow } from "@/modules/catch-report/types";
import { CatchReportAiReviewSection } from "@/modules/studio/ai-review/components/catch-report-ai-review-section";
import type { AiReviewSessionView } from "@/modules/studio/ai-review/types";

type CatchReportsReviewPanelProps = {
  reports: CatchReportReviewRow[];
  aiSessions?: Record<string, AiReviewSessionView | null>;
};

export function CatchReportsReviewPanel({
  reports,
  aiSessions = {},
}: CatchReportsReviewPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function runAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setMergeSourceId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Action failed");
      }
    });
  }

  if (reports.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No catch reports to review.</p>
    );
  }

  return (
    <div className="space-y-4">
      {mergeSourceId ? (
        <p className="bg-ocean/8 text-ocean rounded-lg px-3 py-2 text-sm">
          Select the duplicate report to merge into the highlighted primary.
        </p>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <ul className="space-y-4">
        {reports.map((report) => (
          <li
            key={report.id}
            className={`border-border/70 rounded-xl border px-4 py-4 ${
              mergeSourceId === report.id ? "ring-ocean ring-2" : ""
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {report.lureModelName.en} · {report.fishSpeciesName.en}
                </p>
                <p className="text-muted-foreground text-xs">
                  {report.manufacturerName} · {report.region} · {report.month}/
                  {report.year}
                </p>
              </div>
              <Badge
                variant={
                  report.verificationStatus === "PENDING" ? "coral" : "turquoise"
                }
              >
                {report.verificationStatus}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              {report.boatOrShore} · {report.catchCount} fish
              {report.notes ? ` · “${report.notes}”` : ""}
            </p>
            {report.verificationStatus === "PENDING" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    runAction(() => approveCatchReport(report.id))
                  }
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    runAction(() => rejectCatchReport(report.id))
                  }
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    setMergeSourceId((current) =>
                      current === report.id ? null : report.id,
                    )
                  }
                >
                  {mergeSourceId === report.id ? "Cancel merge" : "Merge…"}
                </Button>
              </div>
            ) : mergeSourceId && mergeSourceId !== report.id ? (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                disabled={pending}
                onClick={() =>
                  runAction(() =>
                    mergeCatchReports(mergeSourceId, report.id),
                  )
                }
              >
                Merge into primary
              </Button>
            ) : null}
            {report.verificationStatus === "PENDING" ? (
              <CatchReportAiReviewSection
                reportId={report.id}
                techniqueId={report.techniqueId}
                session={aiSessions[report.id] ?? null}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
