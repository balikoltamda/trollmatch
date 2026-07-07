"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  resolveAllImportDiffs,
  resolveImportDiff,
} from "@/modules/studio/actions/product-actions";
import type { ImportFieldChangeRow } from "@/modules/studio/types";

type ImportDiffPanelProps = {
  lureModelId?: string;
  diffs: ImportFieldChangeRow[];
};

type DiffCategory =
  | "Specifications"
  | "Technologies"
  | "Descriptions"
  | "Images"
  | "Variants"
  | "Media"
  | "SEO"
  | "Relationships"
  | "Other";

const CATEGORY_ORDER: DiffCategory[] = [
  "Specifications",
  "Technologies",
  "Descriptions",
  "Images",
  "Variants",
  "Media",
  "SEO",
  "Relationships",
  "Other",
];

function categorizeDiff(diff: ImportFieldChangeRow): DiffCategory {
  const key = diff.fieldKey;
  if (key.startsWith("sync:tech:")) return "Technologies";
  if (key.startsWith("sync:img:")) return "Images";
  if (key.startsWith("sync:var:")) return "Variants";
  if (key.startsWith("sync:media:") || key.startsWith("sync:dl:")) return "Media";
  if (key.startsWith("sync:rel:")) return "Relationships";
  if (key.startsWith("seo:")) return "SEO";
  if (key.startsWith("shortDescription")) return "Descriptions";
  return "Specifications";
}

function changeKindLabel(kind: string): string {
  return kind.charAt(0) + kind.slice(1).toLowerCase();
}

export function ImportDiffPanel({ lureModelId, diffs }: ImportDiffPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const grouped = useMemo(() => {
    const map = new Map<DiffCategory, ImportFieldChangeRow[]>();
    for (const diff of diffs) {
      const category = categorizeDiff(diff);
      const list = map.get(category) ?? [];
      list.push(diff);
      map.set(category, list);
    }
    return CATEGORY_ORDER.filter((category) => map.has(category)).map(
      (category) => ({
        category,
        items: map.get(category)!,
      }),
    );
  }, [diffs]);

  if (diffs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No pending import changes for this product.
      </p>
    );
  }

  function resolve(
    diffId: string,
    decision: "accept" | "reject",
    editedValue?: string,
  ) {
    startTransition(async () => {
      const result = await resolveImportDiff(diffId, decision, editedValue);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(
        decision === "accept"
          ? "Import change accepted."
          : "Import change rejected.",
      );
      router.refresh();
    });
  }

  function resolveAll(decision: "accept" | "reject") {
    if (!lureModelId) return;
    startTransition(async () => {
      const result = await resolveAllImportDiffs(lureModelId, decision);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(
        decision === "accept"
          ? `Accepted all ${result.resolved} change(s).`
          : `Rejected all ${result.resolved} change(s).`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {lureModelId ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm" })}
            onClick={() => resolveAll("accept")}
          >
            Accept all
          </button>
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm", variant: "outline" })}
            onClick={() => resolveAll("reject")}
          >
            Reject all
          </button>
        </div>
      ) : null}

      {message ? (
        <p className="text-muted-foreground text-sm">{message}</p>
      ) : null}

      <div className="space-y-6">
        {grouped.map(({ category, items }) => (
          <section key={category} className="space-y-3">
            <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {category}
            </h4>
            <ul className="space-y-4">
              {items.map((diff) => {
                const draft =
                  edits[diff.id] ?? diff.editedValue ?? diff.newValue ?? "";
                return (
                  <li
                    key={diff.id}
                    className="border-border/70 rounded-xl border px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{diff.fieldLabel}</p>
                      <Badge variant="muted">{changeKindLabel(diff.changeKind)}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-[1fr_auto_1fr] md:items-center">
                      <div className="bg-muted/40 rounded-lg px-3 py-2">
                        <p className="text-muted-foreground text-xs">Current value</p>
                        <p className="mt-1 break-words">{diff.oldValue ?? "—"}</p>
                      </div>
                      <span className="text-muted-foreground text-center">↓</span>
                      <div className="bg-ocean/5 rounded-lg px-3 py-2">
                        <p className="text-muted-foreground text-xs">Manufacturer value</p>
                        <p className="mt-1 break-words">{diff.newValue ?? "—"}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-muted-foreground text-xs font-medium">
                        Edit before accepting
                      </label>
                      <textarea
                        className="border-input bg-background mt-1 min-h-20 w-full rounded-lg border px-3 py-2 text-sm"
                        value={draft}
                        onChange={(e) =>
                          setEdits((current) => ({
                            ...current,
                            [diff.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        className={buttonVariants({ size: "sm" })}
                        onClick={() =>
                          resolve(
                            diff.id,
                            "accept",
                            edits[diff.id] !== undefined ? draft : undefined,
                          )
                        }
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        className={buttonVariants({ size: "sm", variant: "outline" })}
                        onClick={() => resolve(diff.id, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
