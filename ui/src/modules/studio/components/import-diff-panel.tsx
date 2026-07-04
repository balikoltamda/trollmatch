"use client";

import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { resolveImportDiff } from "@/modules/studio/actions/product-actions";
import type { ImportFieldChangeRow } from "@/modules/studio/types";

type ImportDiffPanelProps = {
  lureModelId: string;
  diffs: ImportFieldChangeRow[];
};

export function ImportDiffPanel({ diffs }: ImportDiffPanelProps) {
  const [pending, startTransition] = useTransition();

  if (diffs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No pending import changes for this product.
      </p>
    );
  }

  function resolve(diffId: string, decision: "accept" | "reject") {
    startTransition(async () => {
      await resolveImportDiff(diffId, decision);
    });
  }

  return (
    <ul className="space-y-4">
      {diffs.map((diff) => (
        <li
          key={diff.id}
          className="border-border/70 rounded-xl border px-4 py-4"
        >
          <p className="text-sm font-medium">{diff.fieldLabel}</p>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="bg-muted/40 rounded-lg px-3 py-2">
              <p className="text-muted-foreground text-xs">Old value</p>
              <p className="mt-1">{diff.oldValue ?? "—"}</p>
            </div>
            <span className="text-muted-foreground text-center">↓</span>
            <div className="bg-ocean/5 rounded-lg px-3 py-2">
              <p className="text-muted-foreground text-xs">New value</p>
              <p className="mt-1">{diff.newValue ?? "—"}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              className={buttonVariants({ size: "sm" })}
              onClick={() => resolve(diff.id, "accept")}
            >
              Accept
            </button>
            <button
              type="button"
              disabled={pending}
              className={buttonVariants({ size: "sm", variant: "outline" })}
              onClick={() => resolve(diff.id, "reject")}
            >
              Reject & revert
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
