"use client";

import { useTransition } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { runManufacturerImport } from "@/modules/studio/actions/import-actions";
import {
  StudioTable,
  StudioTd,
  StudioTh,
} from "@/modules/studio/components/studio-ui";
import type { ImportManufacturerRow } from "@/modules/studio/types";
import { cn } from "@/lib/utils";

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ImportCenterTable({ rows }: { rows: ImportManufacturerRow[] }) {
  return (
    <StudioTable>
      <thead>
        <tr>
          <StudioTh>Manufacturer</StudioTh>
          <StudioTh>Status</StudioTh>
          <StudioTh>Last import</StudioTh>
          <StudioTh>New</StudioTh>
          <StudioTh>Updated</StudioTh>
          <StudioTh>Missing</StudioTh>
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
  );
}

function ImportRow({ row }: { row: ImportManufacturerRow }) {
  const [pending, startTransition] = useTransition();

  return (
    <tr className="hover:bg-muted/30">
      <StudioTd>
        <div>
          <p className="font-medium">{row.displayName}</p>
          <p className="text-muted-foreground text-xs">
            {row.code} · {row.productCount} products
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
      <StudioTd>{row.lastImport?.createdCount ?? "—"}</StudioTd>
      <StudioTd>{row.lastImport?.updatedCount ?? "—"}</StudioTd>
      <StudioTd>{row.lastImport?.missingCount ?? "—"}</StudioTd>
      <StudioTd>{formatDuration(row.lastImport?.durationMs)}</StudioTd>
      <StudioTd>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm" })}
            onClick={() =>
              startTransition(async () => {
                await runManufacturerImport(row.code);
              })
            }
          >
            {pending ? "Importing…" : "Import now"}
          </button>
          {row.lastImport?.reportPath ? (
            <Link
              href={`/studio/import/${row.code}`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              History
            </Link>
          ) : (
            <Link
              href={`/studio/import/${row.code}`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              History
            </Link>
          )}
        </div>
      </StudioTd>
    </tr>
  );
}
