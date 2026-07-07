"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  scanAllEditorialEntities,
  scanEditorialEntity,
} from "@/modules/studio/ai-review/actions/ai-review-actions";

type IntelligenceScanControlsProps = {
  entityCount: number;
};

export function IntelligenceScanControls({ entityCount }: IntelligenceScanControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function runScan(mode: "all" | "sample") {
    setMessage(null);
    startTransition(async () => {
      const result =
        mode === "all"
          ? await scanAllEditorialEntities()
          : await scanAllEditorialEntities({ limit: 10 });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(
        `Scanned ${result.scanned} entities${result.failed > 0 ? ` · ${result.failed} failed` : ""}.`,
      );
      router.refresh();
    });
  }

  return (
    <section className="border-border bg-muted/10 space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Background scan</h2>
          <p className="text-muted-foreground text-xs">
            Deterministic graph scan — {entityCount} entities in catalog. Reusable by future cron jobs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm", variant: "outline" })}
            onClick={() => runScan("sample")}
          >
            Scan sample (10)
          </button>
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm" })}
            onClick={() => runScan("all")}
          >
            {pending ? "Scanning…" : "Scan all entities"}
          </button>
        </div>
      </div>
      {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}
    </section>
  );
}

export function EntityScanButton({
  entityType,
  entityId,
}: {
  entityType: Parameters<typeof scanEditorialEntity>[0];
  entityId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        className={buttonVariants({ size: "sm", variant: "ghost" })}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await scanEditorialEntity(entityType, entityId);
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setMessage(`Scanned · ${result.readinessScore}% readiness`);
            router.refresh();
          });
        }}
      >
        {pending ? "Scanning…" : "Rescan entity"}
      </button>
      {message ? <span className="text-muted-foreground text-xs">{message}</span> : null}
    </div>
  );
}
