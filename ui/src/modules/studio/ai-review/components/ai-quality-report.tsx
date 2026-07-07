"use client";

import { Badge } from "@/components/ui/badge";
import {
  computeReadinessScore,
  parseQualityReportFromSession,
  parseReadinessScoreFromSession,
  parseScoreBoardFromSession,
  SCORE_CATEGORY_LABELS,
  statusIcon,
  type QualityCheckItem,
  type ScoreCategory,
} from "@/modules/studio/ai-review/lib/quality-report";
import { groupChecksByCategory } from "@/modules/studio/ai-review/lib/score-board";
import type { AiReviewSessionView } from "@/modules/studio/ai-review/types";

type AiQualityReportProps = {
  session: AiReviewSessionView | null;
  checks?: QualityCheckItem[];
};

function tone(status: QualityCheckItem["status"]): "ocean" | "coral" | "muted" {
  if (status === "pass") return "ocean";
  if (status === "fail") return "coral";
  return "muted";
}

export function AiQualityReport({ session, checks }: AiQualityReportProps) {
  const items =
    checks ??
    (session ? parseQualityReportFromSession(session.suggestions) : []);
  if (items.length === 0) return null;

  const board = session ? parseScoreBoardFromSession(session.suggestions) : null;
  const score =
    board?.overall ??
    parseReadinessScoreFromSession(session?.suggestions ?? []) ??
    computeReadinessScore(items);

  const grouped = groupChecksByCategory(items);

  return (
    <section className="border-border space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Quality report</h2>
        <Badge variant={score >= 85 ? "ocean" : score >= 60 ? "muted" : "coral"}>
          Overall {score}%
        </Badge>
      </div>

      {(Object.keys(grouped) as ScoreCategory[]).map((category) => {
        const categoryChecks = grouped[category];
        if (categoryChecks.length === 0) return null;
        const catScore = Math.round(
          (categoryChecks.filter((c: QualityCheckItem) => c.status === "pass").length /
            categoryChecks.length) *
            100,
        );
        return (
          <div key={category} className="space-y-1">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {SCORE_CATEGORY_LABELS[category]} · {catScore}%
            </p>
            <ul className="space-y-1 text-sm">
              {categoryChecks.map((item: QualityCheckItem) => (
                <li key={item.id} className="flex gap-2">
                  <span aria-hidden>{statusIcon(item.status)}</span>
                  <span>
                    <span className="font-medium">{item.label}</span>
                    {item.detail ? (
                      <span className="text-muted-foreground"> — {item.detail}</span>
                    ) : null}
                  </span>
                  <Badge variant={tone(item.status)} className="ml-auto shrink-0 text-[10px]">
                    {item.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
