"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  approveSuggestion,
  rejectSuggestion,
} from "@/modules/studio/actions/suggestion-actions";

type CommunitySuggestionActionsProps = {
  suggestionId: string;
  productId: string;
};

export function CommunitySuggestionActions({
  suggestionId,
  productId,
}: CommunitySuggestionActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        className={buttonVariants({ size: "sm" })}
        onClick={() => run(() => approveSuggestion(suggestionId))}
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        className={buttonVariants({ size: "sm", variant: "outline" })}
        onClick={() => run(() => rejectSuggestion(suggestionId))}
      >
        Reject
      </button>
      <Link
        href={`/studio/products/${productId}`}
        className={buttonVariants({ size: "sm", variant: "ghost" })}
      >
        Open product
      </Link>
    </div>
  );
}
