"use client";

import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

type LurePreviewCardProps = {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  previewImagePlaceholder: string;
  manufacturerLabel: string;
  modelLabel: string;
  variantLabel: string;
  colorLabel: string;
  manufacturer: string | null;
  model: string | null;
  variant: string | null;
  color: string | null;
  notSelectedLabel: string;
};

export function LurePreviewCard({
  title,
  emptyTitle,
  emptyDescription,
  previewImagePlaceholder,
  manufacturerLabel,
  modelLabel,
  variantLabel,
  colorLabel,
  manufacturer,
  model,
  variant,
  color,
  notSelectedLabel,
}: LurePreviewCardProps) {
  const hasSelection = manufacturer || model || variant || color;
  const imageLabel = model ?? previewImagePlaceholder;

  return (
    <aside
      aria-label={title}
      className="border-border bg-card text-card-foreground rounded-xl border p-4 sm:p-5"
    >
      <h2 className="text-foreground mb-4 text-base font-semibold tracking-tight">
        {title}
      </h2>

      <div
        className={cn(
          "bg-muted/40 mb-4 flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed",
          hasSelection && "border-border border-solid bg-muted/20",
        )}
      >
        <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 text-center">
          <Package className="size-8" aria-hidden />
          {hasSelection ? (
            <>
              <p className="text-foreground text-sm font-medium">{imageLabel}</p>
              {manufacturer ? (
                <p className="text-muted-foreground text-xs">{manufacturer}</p>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-sm font-medium">{emptyTitle}</p>
              <p className="text-xs leading-relaxed">{emptyDescription}</p>
            </>
          )}
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        <PreviewRow
          label={manufacturerLabel}
          value={manufacturer}
          notSelectedLabel={notSelectedLabel}
        />
        <PreviewRow
          label={modelLabel}
          value={model}
          notSelectedLabel={notSelectedLabel}
        />
        <PreviewRow
          label={variantLabel}
          value={variant}
          notSelectedLabel={notSelectedLabel}
        />
        <PreviewRow
          label={colorLabel}
          value={color}
          notSelectedLabel={notSelectedLabel}
        />
      </dl>
    </aside>
  );
}

type PreviewRowProps = {
  label: string;
  value: string | null;
  notSelectedLabel: string;
};

function PreviewRow({ label, value, notSelectedLabel }: PreviewRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd
        className={cn(
          "text-right font-medium",
          value ? "text-foreground" : "text-muted-foreground font-normal",
        )}
      >
        {value ?? notSelectedLabel}
      </dd>
    </div>
  );
}
