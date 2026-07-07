"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  archiveProduct,
  downloadProductMediaNow,
  generateMissingProductContentAction,
  publishProduct,
  refreshManufacturerData,
  runEditorialIntelligence,
} from "@/modules/studio/actions/product-actions";
import { cn } from "@/lib/utils";

type ProductToolbarProps = {
  productId: string;
  slug: string;
  lifecycleState: string;
  canRefreshManufacturer: boolean;
  pending: boolean;
  onMessage: (message: string) => void;
  onPendingChange?: (pending: boolean) => void;
  className?: string;
};

export function ProductToolbar({
  productId,
  slug,
  lifecycleState,
  canRefreshManufacturer,
  pending,
  onMessage,
  onPendingChange,
  className,
}: ProductToolbarProps) {
  const router = useRouter();
  const [toolbarPending, startTransition] = useTransition();
  const isBusy = pending || toolbarPending;

  function run(
    action: () => Promise<{ ok: boolean; error?: string } & Record<string, unknown>>,
    success: string,
  ) {
    startTransition(async () => {
      onPendingChange?.(true);
      const result = await action();
      onPendingChange?.(false);
      if (!result.ok) {
        onMessage(result.error ?? "Action failed");
        return;
      }
      onMessage(success);
      router.refresh();
    });
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button
        type="button"
        disabled={isBusy || !canRefreshManufacturer}
        className={buttonVariants({ size: "sm", variant: "secondary" })}
        onClick={() =>
          run(
            () => refreshManufacturerData(productId),
            "Manufacturer data refreshed — review detected changes.",
          )
        }
      >
        Refresh Manufacturer Data
      </button>
      <button
        type="button"
        disabled={isBusy}
        className={buttonVariants({ size: "sm", variant: "outline" })}
        onClick={() =>
          run(
            () => runEditorialIntelligence(productId),
            "Editorial Intelligence review queued.",
          )
        }
      >
        Run Editorial Intelligence
      </button>
      <button
        type="button"
        disabled={isBusy}
        className={buttonVariants({ size: "sm", variant: "outline" })}
        onClick={() =>
          run(async () => {
            const result = await generateMissingProductContentAction(productId);
            if (!result.ok) return result;
            const count = result.filledFields.length;
            return {
              ok: true,
              error: count
                ? undefined
                : "All content fields already populated.",
            };
          }, "Missing content drafts generated.")
        }
      >
        Generate Missing Content
      </button>
      <button
        type="button"
        disabled={isBusy}
        className={buttonVariants({ size: "sm", variant: "outline" })}
        onClick={() =>
          run(async () => {
            const result = await downloadProductMediaNow(productId);
            if (!result.ok) return result;
            const parts = [
              result.downloaded ? `${result.downloaded} downloaded` : null,
              result.skipped ? `${result.skipped} already local` : null,
              result.failed ? `${result.failed} failed` : null,
            ].filter(Boolean);
            return {
              ok: true,
              error: parts.length ? undefined : "No remote media to download.",
            };
          }, "Media downloaded to local library.")
        }
      >
        Download Media Now
      </button>
      <Link
        href={`/en/lures/${slug}`}
        className={buttonVariants({ size: "sm", variant: "outline" })}
        target="_blank"
      >
        Preview Public Page
      </Link>
      {lifecycleState !== "PUBLISHED" ? (
        <button
          type="button"
          disabled={isBusy}
          className={buttonVariants({ size: "sm" })}
          onClick={() => run(() => publishProduct(productId), "Product published.")}
        >
          Publish
        </button>
      ) : null}
      {lifecycleState !== "ARCHIVED" ? (
        <button
          type="button"
          disabled={isBusy}
          className={buttonVariants({ size: "sm", variant: "ghost" })}
          onClick={() => run(() => archiveProduct(productId), "Product archived.")}
        >
          Archive
        </button>
      ) : null}
    </div>
  );
}
