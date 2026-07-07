"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { moveRegion, setRegionActive } from "@/modules/region/actions/region-actions";
import { cn } from "@/lib/utils";

type RegionRowActionsProps = {
  slug: string;
  isActive: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export function RegionRowActions({
  slug,
  isActive,
  canMoveUp,
  canMoveDown,
}: RegionRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      await setRegionActive(slug, !isActive);
      router.refresh();
    });
  }

  function reorder(direction: "up" | "down") {
    startTransition(async () => {
      await moveRegion(slug, direction);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "px-2")}
        disabled={pending || !canMoveUp}
        onClick={() => reorder("up")}
        aria-label="Move up"
      >
        ↑
      </button>
      <button
        type="button"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "px-2")}
        disabled={pending || !canMoveDown}
        onClick={() => reorder("down")}
        aria-label="Move down"
      >
        ↓
      </button>
      <button
        type="button"
        className={buttonVariants({
          size: "sm",
          variant: isActive ? "outline" : "default",
        })}
        disabled={pending}
        onClick={toggleActive}
      >
        {isActive ? "Disable" : "Enable"}
      </button>
      <Link
        href={`/studio/regions/${slug}`}
        className={buttonVariants({ size: "sm", variant: "ghost" })}
      >
        Edit
      </Link>
    </div>
  );
}
