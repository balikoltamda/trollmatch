"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { enqueueManufacturerImport } from "@/modules/studio/actions/import-actions";

type ImportBatchRetryButtonProps = {
  manufacturerCode: string;
};

export function ImportBatchRetryButton({
  manufacturerCode,
}: ImportBatchRetryButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={buttonVariants({ size: "sm", variant: "outline" })}
      onClick={() => {
        startTransition(async () => {
          const result = await enqueueManufacturerImport(manufacturerCode);
          if (result.ok) {
            router.push(`/studio/import/batch/${result.batchId}`);
          }
        });
      }}
    >
      Retry import
    </button>
  );
}
