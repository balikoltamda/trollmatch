"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getEntityEditorialInsights } from "@/modules/notification-center/actions/notification-actions";
import type { EntityEditorialInsights } from "@/modules/notification-center/types";
import { STUDIO_WORK_QUEUE_PATH } from "@/modules/studio/lib/studio-routes";
import type { StudioReviewEntityType } from "@/generated/prisma/client";

type EntityInsightsPanelProps = {
  entityType: StudioReviewEntityType;
  entityId: string;
  entityLabel?: string;
};

export function EntityInsightsPanel({
  entityType,
  entityId,
  entityLabel,
}: EntityInsightsPanelProps) {
  const [insights, setInsights] = useState<EntityEditorialInsights | null>(null);

  useEffect(() => {
    void getEntityEditorialInsights(entityType, entityId).then((result) => {
      if ("openCount" in result) setInsights(result);
    });
  }, [entityType, entityId]);

  if (!insights) {
    return (
      <aside className="border-border bg-muted/5 rounded-lg border px-4 py-3">
        <p className="text-muted-foreground text-xs">Loading editorial insights…</p>
      </aside>
    );
  }

  return (
    <aside className="border-border bg-muted/5 space-y-3 rounded-lg border px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold tracking-wide uppercase">Entity Insights</h2>
          {entityLabel ? (
            <p className="text-muted-foreground text-xs">{entityLabel}</p>
          ) : null}
        </div>
        <Link href={STUDIO_WORK_QUEUE_PATH} className={buttonVariants({ size: "sm", variant: "ghost" })}>
          Work queue
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Readiness</p>
          <p className="text-lg font-semibold">
            {insights.readinessScore != null ? `${insights.readinessScore}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Last scan</p>
          <p className="text-xs">
            {insights.latestReviewDate
              ? new Date(insights.latestReviewDate).toLocaleString()
              : "Not scanned"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Open</p>
          <Badge variant={insights.openCount > 0 ? "coral" : "ocean"}>{insights.openCount}</Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase">Resolved</p>
          <Badge variant="muted">{insights.resolvedCount}</Badge>
        </div>
      </div>

      {insights.openNotifications.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-medium">Open notifications</p>
          <ul className="space-y-1">
            {insights.openNotifications.slice(0, 4).map((n) => (
              <li key={n.id} className="text-muted-foreground text-xs">
                <span className="text-foreground font-medium">{n.title}</span>
                {n.description ? ` — ${n.description.slice(0, 80)}` : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {insights.resolvedNotifications.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-medium">Recently resolved</p>
          <ul className="space-y-1">
            {insights.resolvedNotifications.slice(0, 3).map((n) => (
              <li key={n.id} className="text-muted-foreground text-xs line-through opacity-70">
                {n.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
