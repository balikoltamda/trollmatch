"use client";

import { useMemo, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  reorderProductImages,
  setCoverImage,
} from "@/modules/studio/actions/product-actions";

type ImageItem = {
  id: string;
  url: string;
  role: string;
  sortOrder: number;
};

type ImageReviewPanelProps = {
  lureModelId: string;
  images: ImageItem[];
};

export function ImageReviewPanel({
  lureModelId,
  images: initialImages,
}: ImageReviewPanelProps) {
  const [pending, startTransition] = useTransition();
  const images = useMemo(
    () => [...initialImages].sort((a, b) => a.sortOrder - b.sortOrder),
    [initialImages],
  );

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (images.length === 0) list.push("No images — add or re-import media.");
    if (!images.some((img) => img.role === "HERO")) {
      list.push("No cover image — select one below.");
    }
    const urls = images.map((i) => i.url);
    const dupes = urls.filter((u, i) => urls.indexOf(u) !== i);
    if (dupes.length > 0) list.push("Duplicate image URLs detected.");
    const broken = images.filter((i) => !i.url?.trim());
    if (broken.length > 0) list.push("Broken or empty image URLs found.");
    return list;
  }, [images]);

  function makeCover(imageId: string) {
    startTransition(async () => {
      await setCoverImage(lureModelId, imageId);
    });
  }

  function move(imageId: string, direction: -1 | 1) {
    const ids = images.map((i) => i.id);
    const index = ids.indexOf(imageId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    startTransition(async () => {
      await reorderProductImages(lureModelId, ids);
    });
  }

  return (
    <div className="space-y-4">
      {warnings.length > 0 ? (
        <ul className="border-coral/40 bg-coral/5 rounded-lg border px-4 py-3 text-sm">
          {warnings.map((w) => (
            <li key={w} className="text-coral">
              {w}
            </li>
          ))}
        </ul>
      ) : null}

      {images.length === 0 ? (
        <p className="text-muted-foreground text-sm">No images yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, index) => (
            <div
              key={img.id}
              className="border-border/70 overflow-hidden rounded-xl border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="bg-muted aspect-square w-full object-contain"
              />
              <div className="space-y-2 px-3 py-2">
                <p className="text-xs font-medium">
                  {img.role === "HERO" ? "Cover" : img.role}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {img.url}
                </p>
                <div className="flex flex-wrap gap-1">
                  {img.role !== "HERO" ? (
                    <button
                      type="button"
                      disabled={pending}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                      onClick={() => makeCover(img.id)}
                    >
                      Set cover
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending || index === 0}
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                    onClick={() => move(img.id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={pending || index === images.length - 1}
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                    onClick={() => move(img.id, 1)}
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
