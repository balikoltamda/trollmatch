"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { refreshManufacturerData } from "@/modules/studio/actions/product-actions";
import { ImportDiffPanel } from "@/modules/studio/components/import-diff-panel";
import type { ImportFieldChangeRow, ProductEditorData } from "@/modules/studio/types";
import { cn } from "@/lib/utils";

type ManufacturerSyncPanelProps = {
  lureModelId: string;
  manufacturerSourceUrl: string | null;
  canRefreshManufacturer: boolean;
  lastImportedAt: Date | null;
  lastEditorialReviewAt: Date | null;
  changesAvailable: number;
  pendingImportDiffs: ImportFieldChangeRow[];
  digitalTwin: ProductEditorData["digitalTwin"];
  formFactorEn: string | null;
  formFactorTr: string | null;
  shortDescriptionEn: string | null;
  shortDescriptionTr: string | null;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
  missingImportCount: number;
  aliases: { alias: string; kind: string }[];
};

function formatTimestamp(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleString();
}

export function ManufacturerSyncPanel({
  lureModelId,
  manufacturerSourceUrl,
  canRefreshManufacturer,
  lastImportedAt,
  lastEditorialReviewAt,
  changesAvailable,
  pendingImportDiffs,
  digitalTwin,
  formFactorEn,
  formFactorTr,
  shortDescriptionEn,
  shortDescriptionTr,
  firstSeenAt,
  lastSeenAt,
  missingImportCount,
  aliases,
}: ManufacturerSyncPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleRefresh() {
    startTransition(async () => {
      const result = await refreshManufacturerData(lureModelId);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      const parts = [
        `Manufacturer sync complete — ${result.diffCount} change(s) detected.`,
      ];
      if (result.filledShortDescription) {
        parts.push("Empty short description auto-filled.");
      }
      if (result.filledLongDescription) {
        parts.push("Long description editorial draft generated.");
      }
      if (result.contentUnchanged) {
        parts.push("Manufacturer page unchanged since last sync.");
      }
      if (result.generatedFields.length > 0) {
        parts.push(`Generated: ${result.generatedFields.join(", ")}.`);
      }
      setMessage(parts.join(" "));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="border-border/70 bg-card rounded-xl border p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Manufacturer synchronization</h3>
            <p className="text-muted-foreground mt-1 max-w-prose text-sm">
              Refresh this product from its manufacturer page without re-importing
              the full catalog. Detected differences require editor review.
            </p>
          </div>
          <button
            type="button"
            disabled={pending || !canRefreshManufacturer}
            className={buttonVariants({ size: "sm" })}
            onClick={handleRefresh}
          >
            {pending ? "Refreshing…" : "Refresh Manufacturer Data"}
          </button>
        </div>

        {!canRefreshManufacturer ? (
          <p className="text-muted-foreground mt-4 text-sm">
            Single-product refresh is not available for this manufacturer yet.
          </p>
        ) : null}

        {message ? (
          <p className="text-muted-foreground mt-4 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            {message}
          </p>
        ) : null}

        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SyncStat
            label="Last manufacturer sync"
            value={formatTimestamp(
              digitalTwin.lastManufacturerSyncAt ?? lastImportedAt,
            )}
          />
          <SyncStat
            label="Last editorial review"
            value={formatTimestamp(lastEditorialReviewAt)}
          />
          <SyncStat
            label="Last manufacturer check"
            value={formatTimestamp(digitalTwin.lastManufacturerCheckAt)}
          />
          <SyncStat
            label="Last successful import"
            value={formatTimestamp(digitalTwin.lastSuccessfulImportAt)}
          />
          <div className="border-border/50 bg-muted/20 rounded-lg border px-3 py-2.5">
            <dt className="text-muted-foreground text-xs font-medium">Sync status</dt>
            <dd className="mt-1 flex items-center gap-2">
              <Badge variant={syncStatusVariant(digitalTwin.syncStatus)}>
                {digitalTwin.syncStatus.replace(/_/g, " ")}
              </Badge>
              {digitalTwin.manufacturerUpdated ? (
                <Badge variant="coral">Manufacturer updated</Badge>
              ) : null}
            </dd>
          </div>
          <div className="border-border/50 bg-muted/20 rounded-lg border px-3 py-2.5">
            <dt className="text-muted-foreground text-xs font-medium">Changes available</dt>
            <dd className="mt-1 flex items-center gap-2">
              <span className="text-sm font-medium tabular-nums">{changesAvailable}</span>
              {changesAvailable > 0 ? (
                <Badge variant="coral">Review needed</Badge>
              ) : (
                <Badge variant="turquoise">Up to date</Badge>
              )}
            </dd>
          </div>
          <SyncStat
            label="Editorial updated"
            value={formatTimestamp(digitalTwin.editorialUpdatedAt)}
          />
          <div className="border-border/50 bg-muted/20 rounded-lg border px-3 py-2.5 sm:col-span-2">
            <dt className="text-muted-foreground text-xs font-medium">Content hash</dt>
            <dd className="mt-1 font-mono text-xs break-all">
              {digitalTwin.contentHash ?? "—"}
            </dd>
          </div>
          <div className="border-border/50 bg-muted/20 rounded-lg border px-3 py-2.5 sm:col-span-2">
            <dt className="text-muted-foreground text-xs font-medium">Manufacturer URL</dt>
            <dd className="mt-1 text-sm">
              {manufacturerSourceUrl ? (
                <Link
                  href={manufacturerSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ocean hover:underline break-all"
                >
                  {manufacturerSourceUrl}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Importer-owned fields</h3>
        <p className="text-muted-foreground text-sm">
          Read-only manufacturer data. Imports never overwrite editor notes.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label="Form factor (EN)" value={formFactorEn} />
          <ReadOnlyField label="Form factor (TR)" value={formFactorTr} />
          <ReadOnlyField label="Short description (EN)" value={shortDescriptionEn} />
          <ReadOnlyField label="Short description (TR)" value={shortDescriptionTr} />
          <ReadOnlyField label="First seen" value={formatTimestamp(firstSeenAt)} />
          <ReadOnlyField label="Last seen" value={formatTimestamp(lastSeenAt)} />
          <ReadOnlyField label="Missing import count" value={String(missingImportCount)} />
        </div>
        {aliases.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium">Aliases</p>
            <ul className="text-muted-foreground space-y-1 text-sm">
              {aliases.map((a) => (
                <li key={`${a.kind}-${a.alias}`}>
                  {a.alias} <span className="text-xs">({a.kind})</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Detected differences</h3>
        <p className="text-muted-foreground text-sm">
          Compare specifications, technologies, descriptions, images, variants,
          media, SEO, and relationships. Accept or reject each change — editor-approved
          values are never overwritten automatically.
        </p>
        <ImportDiffPanel
          lureModelId={lureModelId}
          diffs={pendingImportDiffs}
        />
      </section>
    </div>
  );
}

function syncStatusVariant(
  status: string,
): "ocean" | "coral" | "turquoise" | "muted" {
  switch (status) {
    case "SYNCED":
      return "turquoise";
    case "CHANGES_PENDING":
    case "STALE":
      return "coral";
    case "CHECK_FAILED":
      return "coral";
    default:
      return "muted";
  }
}

function SyncStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/50 bg-muted/20 rounded-lg border px-3 py-2.5">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className={cn("mt-1 text-sm", value === "—" && "text-muted-foreground")}>
        {value}
      </dd>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="border-border/50 bg-muted/20 rounded-lg border px-3 py-2.5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-sm">{value ?? "—"}</p>
    </div>
  );
}
