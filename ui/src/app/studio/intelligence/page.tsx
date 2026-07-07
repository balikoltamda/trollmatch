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
import { IntelligenceScanControls } from "@/modules/studio/ai-review/components/intelligence-scan-controls";
import { loadIntelligenceDashboard } from "@/modules/studio/ai-review/data/intelligence-dashboard";
import { READINESS_STATUS_LABELS } from "@/modules/studio/ai-review/lib/readiness-status";
import { STUDIO_INTELLIGENCE_PATH } from "@/modules/studio/lib/studio-routes";
import type { IntelligenceEntityRow } from "@/modules/studio/ai-review/data/intelligence-dashboard";

export const dynamic = "force-dynamic";

function entityLink(type: string, id: string | null): string | null {
  if (!id) return null;
  switch (type) {
    case "SPECIES":
      return `/studio/species/${id}`;
    case "LURE":
      return `/studio/products/${id}`;
    case "MANUFACTURER":
      return `/studio/manufacturers/${id}`;
    case "REGION":
      return `/studio/regions/${id}`;
    case "TECHNIQUE":
      return "/studio/techniques";
    case "KNOWLEDGE_SOURCE":
      return "/studio/source-archive";
    case "CATCH_REPORT":
      return "/studio/community/reports";
    default:
      return null;
  }
}

export default async function StudioIntelligencePage() {
  const data = await loadIntelligenceDashboard();

  return (
    <>
      <StudioPageHeader
        title="Editorial Intelligence"
        description="Platform-wide quality system — scans the full knowledge graph. Deterministic validation; AI assists suggestions only."
      />
      <StudioPageBody>
        <IntelligenceScanControls entityCount={data.scannableEntityCount} />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StudioStatCard label="Entities tracked" value={data.totals.sessions} />
          <StudioStatCard label="Avg readiness" value={`${data.totals.avgScore}%`} />
          <StudioStatCard label="Pending suggestions" value={data.totals.pendingSuggestions} />
          <StudioStatCard label="Possible duplicates" value={data.possibleDuplicates} />
        </div>

        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold">Entities needing review</h2>
          <EntityTable rows={data.needsReview} empty="No pending reviews." />
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold">Low quality (&lt; 70%)</h2>
          <EntityTable rows={data.lowScore} empty="No low-score entities." />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <DashboardSection title="Missing translations" rows={data.missingTranslations} empty="All tracked entities have localization coverage." />
          <DashboardSection title="Missing media" rows={data.missingMedia} empty="No media gaps detected." />
          <DashboardSection title="Missing techniques" rows={data.missingTechniques} empty="Technique links look complete." />
          <DashboardSection title="Missing regions" rows={data.missingRegions} empty="Region coverage looks complete." />
          <DashboardSection title="Missing knowledge" rows={data.missingKnowledge} empty="Knowledge graph links look complete." />
          <DashboardSection title="Broken graph" rows={data.brokenGraph} empty="No broken relationships detected." />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Top quality</h2>
            <EntityTable rows={data.topQuality} empty="No scored entities yet." />
          </div>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Recent improvements</h2>
            <EntityTable rows={data.recentImprovements} empty="No score improvements yet." showDelta />
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold">Recently reviewed</h2>
          <EntityTable rows={data.recentSessions} empty="No recent sessions." />
        </section>

        <p className="text-muted-foreground mt-8 text-xs">
          Dashboard path: {STUDIO_INTELLIGENCE_PATH} · Engine never modifies production data automatically.
        </p>
      </StudioPageBody>
    </>
  );
}

function DashboardSection({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: IntelligenceEntityRow[];
  empty: string;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <EntityTable rows={rows} empty={empty} compact />
    </div>
  );
}

function EntityTable({
  rows,
  empty,
  compact = false,
  showDelta = false,
}: {
  rows: IntelligenceEntityRow[];
  empty: string;
  compact?: boolean;
  showDelta?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{empty}</p>;
  }

  return (
    <StudioTable>
      <thead>
        <tr>
          <StudioTh>Entity</StudioTh>
          {!compact ? <StudioTh>Type</StudioTh> : null}
          <StudioTh>Score</StudioTh>
          {showDelta ? <StudioTh>Δ</StudioTh> : null}
          {!compact ? <StudioTh>Status</StudioTh> : null}
          {!compact ? <StudioTh>Reviewed</StudioTh> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const href = entityLink(row.entityType, row.entityId);
          return (
            <tr key={`${row.entityType}-${row.entityId}-${row.reviewedAt.toISOString()}`}>
              <StudioTd>
                {href ? (
                  <Link href={href} className="text-ocean hover:underline">
                    {row.label}
                  </Link>
                ) : (
                  row.label
                )}
              </StudioTd>
              {!compact ? <StudioTd>{row.entityType}</StudioTd> : null}
              <StudioTd>{row.overallScore}%</StudioTd>
              {showDelta ? (
                <StudioTd>{row.scoreDelta != null ? `+${row.scoreDelta}%` : "—"}</StudioTd>
              ) : null}
              {!compact ? (
                <StudioTd>{READINESS_STATUS_LABELS[row.readinessStatus]}</StudioTd>
              ) : null}
              {!compact ? <StudioTd>{row.reviewedAt.toLocaleString()}</StudioTd> : null}
            </tr>
          );
        })}
      </tbody>
    </StudioTable>
  );
}
