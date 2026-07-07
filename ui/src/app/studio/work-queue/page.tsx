import Link from "next/link";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import {
  StudioStatCard,
  StudioTable,
  StudioTd,
  StudioTh,
} from "@/modules/studio/components/studio-ui";
import { loadWorkQueue } from "@/modules/notification-center/data/notification-repository";
import { SEVERITY_LABELS } from "@/modules/notification-center/types";
import type { NotificationView } from "@/modules/notification-center/types";
import { requireEditor } from "@/modules/studio/auth/permissions";

export const dynamic = "force-dynamic";

export default async function StudioWorkQueuePage() {
  const auth = await requireEditor();
  const data = await loadWorkQueue(auth.id);

  return (
    <>
      <StudioPageHeader
        title="Work Queue"
        description="Persistent editorial work queue — critical issues, pending review, and recently resolved items."
      />
      <StudioPageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StudioStatCard label="Unresolved" value={data.totals.unresolved} />
          <StudioStatCard label="Critical" value={data.totals.critical} />
          <StudioStatCard label="Reviewed (history)" value={data.totals.reviewed} />
          <StudioStatCard label="Auto-resolved" value={data.totals.resolved} />
        </div>

        <QueueSection title="My pending work" rows={data.myPendingWork} empty="No pending items assigned to you." />
        <QueueSection title="Critical issues" rows={data.criticalIssues} empty="No critical issues." />
        <QueueSection title="Needs review" rows={data.needsReview} empty="Queue is clear." />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <QueueSection title="Recently resolved" rows={data.recentlyResolved} empty="No recent resolutions." compact />
          <QueueSection title="Recently created" rows={data.recentlyCreated} empty="No new items this week." compact />
        </div>
      </StudioPageBody>
    </>
  );
}

function QueueSection({
  title,
  rows,
  empty,
  compact = false,
}: {
  title: string;
  rows: NotificationView[];
  empty: string;
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{empty}</p>
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <StudioTable>
        <thead>
          <tr>
            <StudioTh>Issue</StudioTh>
            {!compact ? <StudioTh>Entity</StudioTh> : null}
            <StudioTh>Severity</StudioTh>
            {!compact ? <StudioTh>Created</StudioTh> : null}
            <StudioTh>Open</StudioTh>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <StudioTd>
                <span className="font-medium">{row.title}</span>
                <p className="text-muted-foreground text-xs">{row.description.slice(0, 100)}</p>
              </StudioTd>
              {!compact ? <StudioTd>{row.entityName ?? "—"}</StudioTd> : null}
              <StudioTd>{SEVERITY_LABELS[row.severity]}</StudioTd>
              {!compact ? (
                <StudioTd>{new Date(row.createdAt).toLocaleString()}</StudioTd>
              ) : null}
              <StudioTd>
                {row.entityHref ? (
                  <Link href={row.entityHref} className="text-ocean text-sm hover:underline">
                    Open
                  </Link>
                ) : (
                  "—"
                )}
              </StudioTd>
            </tr>
          ))}
        </tbody>
      </StudioTable>
    </section>
  );
}
