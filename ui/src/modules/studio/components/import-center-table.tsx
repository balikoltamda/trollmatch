"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  cancelManufacturerImport,
  enqueueManufacturerImport,
} from "@/modules/studio/actions/import-actions";
import { ImportBatchStatusPoller } from "@/modules/studio/components/import-batch-status-poller";
import {
  StudioTable,
  StudioTd,
  StudioTh,
} from "@/modules/studio/components/studio-ui";
import type { ImportManufacturerRow } from "@/modules/studio/types";
import { cn } from "@/lib/utils";

const TERMINAL_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

const ACTIVE_STATUSES = new Set(["QUEUED", "RUNNING"]);

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function batchStatusClass(status: string | undefined): string {
  switch (status) {
    case "COMPLETED":
      return "bg-ocean/10 text-ocean";
    case "RUNNING":
      return "bg-turquoise/15 text-[color-mix(in_oklch,var(--turquoise),var(--navy)_40%)]";
    case "QUEUED":
      return "bg-muted text-muted-foreground";
    case "FAILED":
      return "bg-coral/12 text-[color-mix(in_oklch,var(--coral),var(--navy)_35%)]";
    case "CANCELLED":
      return "bg-muted/60 text-muted-foreground line-through";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ImportCenterTable({ rows }: { rows: ImportManufacturerRow[] }) {
  const statuses = rows.flatMap((row) =>
    row.lastImport ? [row.lastImport.status] : [],
  );

  return (
    <>
      <ImportBatchStatusPoller statuses={statuses} />
      <StudioTable>
      <thead>
        <tr>
          <StudioTh>Manufacturer</StudioTh>
          <StudioTh>Importer</StudioTh>
          <StudioTh>Last run</StudioTh>
          <StudioTh>Status</StudioTh>
          <StudioTh>Imported</StudioTh>
          <StudioTh>Updated</StudioTh>
          <StudioTh>Skipped</StudioTh>
          <StudioTh>Duration</StudioTh>
          <StudioTh className="text-right">Actions</StudioTh>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <ImportRow key={row.code} row={row} />
        ))}
      </tbody>
    </StudioTable>
    </>
  );
}

function ImportRow({ row }: { row: ImportManufacturerRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success";
    message: string;
    batchId?: string;
  } | null>(null);

  const importActive =
    row.lastImport !== null && ACTIVE_STATUSES.has(row.lastImport.status);
  const canCancel = row.lastImport?.status === "QUEUED";

  return (
    <tr className="hover:bg-muted/30">
      <StudioTd>
        <div>
          <p className="font-medium">{row.displayName}</p>
          <p className="text-muted-foreground text-xs">
            {row.code} · {row.productCount} products in catalog
          </p>
        </div>
      </StudioTd>
      <StudioTd>
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            row.status === "active"
              ? "bg-ocean/10 text-ocean"
              : "bg-muted text-muted-foreground",
          )}
        >
          {row.status}
        </span>
      </StudioTd>
      <StudioTd className="text-muted-foreground text-xs">
        {formatDate(row.lastImport?.startedAt)}
      </StudioTd>
      <StudioTd>
        {row.lastImport ? (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                batchStatusClass(row.lastImport.status),
              )}
            >
              {row.lastImport.status}
            </span>
            {row.lastImport &&
            ACTIVE_STATUSES.has(row.lastImport.status) ? (
              <span className="text-muted-foreground text-xs">· live</span>
            ) : null}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </StudioTd>
      <StudioTd>
        {row.lastImport && !TERMINAL_STATUSES.has(row.lastImport.status)
          ? "…"
          : (row.lastImport?.createdCount ?? "—")}
      </StudioTd>
      <StudioTd>
        {row.lastImport && !TERMINAL_STATUSES.has(row.lastImport.status)
          ? "…"
          : (row.lastImport?.updatedCount ?? "—")}
      </StudioTd>
      <StudioTd>
        {row.lastImport && !TERMINAL_STATUSES.has(row.lastImport.status)
          ? "…"
          : (row.lastImport?.skippedCount ?? "—")}
      </StudioTd>
      <StudioTd>{formatDuration(row.lastImport?.durationMs)}</StudioTd>
      <StudioTd>
        <div className="flex flex-col items-end gap-2">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={pending || importActive}
              className={buttonVariants({ size: "sm" })}
              onClick={() => {
                setFeedback(null);
                startTransition(async () => {
                  const result = await enqueueManufacturerImport(row.code);
                  if (result.ok) {
                    setFeedback({
                      tone: "success",
                      message: "Import queued — running in background.",
                      batchId: result.batchId,
                    });
                    router.refresh();
                  } else {
                    setFeedback({
                      tone: "error",
                      message: result.error,
                    });
                  }
                });
              }}
            >
              {importActive ? "In progress…" : pending ? "Queueing…" : "Import now"}
            </button>
            {canCancel && row.lastImport ? (
              <button
                type="button"
                disabled={pending}
                className={buttonVariants({ size: "sm", variant: "outline" })}
                onClick={() => {
                  startTransition(async () => {
                    const result = await cancelManufacturerImport(
                      row.lastImport!.id,
                    );
                    if (result.ok) {
                      router.refresh();
                    } else {
                      setFeedback({
                        tone: "error",
                        message: result.error,
                      });
                    }
                  });
                }}
              >
                Cancel
              </button>
            ) : null}
            <Link
              href={`/studio/import/${row.code}`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              History
            </Link>
          </div>
          {feedback ? (
            <p
              className={cn(
                "max-w-xs text-right text-xs",
                feedback.tone === "error" ? "text-coral" : "text-ocean",
              )}
            >
              {feedback.message}{" "}
              {feedback.batchId ? (
                <Link
                  href={`/studio/import/batch/${feedback.batchId}`}
                  className="font-medium hover:underline"
                >
                  View batch
                </Link>
              ) : null}
            </p>
          ) : null}
        </div>
      </StudioTd>
    </tr>
  );
}
