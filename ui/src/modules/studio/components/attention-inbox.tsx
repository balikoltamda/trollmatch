"use client";

import Link from "next/link";
import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { publishProduct } from "@/modules/studio/actions/product-actions";
import { TrustScorePill } from "@/modules/trust/components/trust-summary";
import { SOURCE_LABELS } from "@/modules/studio/lib/suggestion-labels";
import type { AttentionItem } from "@/modules/studio/data/attention-inbox";
import { EditorialStatusBadge } from "@/modules/studio/components/editorial-status-badge";

type AttentionInboxProps = {
  items: AttentionItem[];
};

const CONFIDENCE_TONE = {
  HIGH: "ocean",
  MEDIUM: "muted",
  LOW: "coral",
} as const;

export function AttentionInbox({ items }: AttentionInboxProps) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <div className="border-border/60 bg-muted/20 rounded-xl border px-6 py-12 text-center">
        <p className="text-lg font-medium">Inbox clear</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Nothing requires your attention today. New imports and community
          reports will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="border-border/70 hover:bg-muted/20 rounded-xl border px-4 py-4 transition-colors"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/studio/products/${item.productId}`}
                  className="hover:text-ocean font-semibold"
                >
                  {item.productName}
                </Link>
                <EditorialStatusBadge
                  state={
                    item.lifecycleState as Parameters<
                      typeof EditorialStatusBadge
                    >[0]["state"]
                  }
                />
                {item.publishReady ? (
                  <Badge variant="turquoise">Ready to publish</Badge>
                ) : (
                  <Badge variant="coral">
                    {item.pendingCount} to verify
                  </Badge>
                )}
                <TrustScorePill score={item.trustScore} />
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {item.manufacturerName} · {item.productSlug}
              </p>

              {item.topSuggestion ? (
                <div className="mt-3">
                  <p className="text-sm font-medium">
                    {item.topSuggestion.fieldLabel}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {item.topSuggestion.currentValue ?? "—"} →{" "}
                    <span className="text-foreground">
                      {item.topSuggestion.suggestedValue ?? "—"}
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      variant={
                        CONFIDENCE_TONE[item.topSuggestion.confidence] ?? "muted"
                      }
                    >
                      {item.topSuggestion.confidence}
                    </Badge>
                    <Badge variant="muted">
                      {SOURCE_LABELS[item.topSuggestion.source]}
                    </Badge>
                  </div>
                  {item.topSuggestion.reasoning ? (
                    <p className="text-muted-foreground mt-2 text-xs">
                      {item.topSuggestion.reasoning}
                    </p>
                  ) : null}
                  {item.topSuggestion.provenance &&
                  Object.keys(item.topSuggestion.provenance).length > 0 ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Provenance:{" "}
                      {Object.entries(item.topSuggestion.provenance)
                        .map(([k, v]) => `${k}=${String(v)}`)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>
              ) : item.publishReady ? (
                <p className="text-muted-foreground mt-2 text-sm">
                  All suggestions verified — one click to publish.
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col gap-2">
              <Link
                href={`/studio/products/${item.productId}`}
                className={buttonVariants({ size: "sm" })}
              >
                {item.publishReady ? "Review & publish" : "Verify"}
              </Link>
              {item.publishReady ? (
                <button
                  type="button"
                  disabled={pending}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  onClick={() =>
                    startTransition(async () => {
                      await publishProduct(item.productId);
                    })
                  }
                >
                  Publish now
                </button>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
