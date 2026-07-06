"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveRuntimeError } from "@/modules/stability/actions/resolve-error";
import type { RuntimeErrorRow } from "@/modules/stability/data/runtime-errors";

type RuntimeErrorsPanelProps = {
  errors: RuntimeErrorRow[];
};

export function RuntimeErrorsPanel({ errors }: RuntimeErrorsPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleResolve(id: string) {
    startTransition(async () => {
      await resolveRuntimeError(id);
      router.refresh();
    });
  }

  if (errors.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No runtime errors logged. Public pages should never show a Next.js error
        page.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {errors.map((row) => (
        <li
          key={row.id}
          className="border-border/70 rounded-xl border px-4 py-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-mono text-sm font-medium">{row.page}</p>
              {row.slug ? (
                <p className="text-muted-foreground text-xs">Slug: {row.slug}</p>
              ) : null}
              {row.operation ? (
                <p className="text-muted-foreground text-xs">
                  Operation: {row.operation}
                </p>
              ) : null}
              <p className="text-muted-foreground mt-2 text-sm">{row.message}</p>
              <p className="text-muted-foreground text-xs">
                {row.createdAt.toLocaleString()}
              </p>
            </div>
            <Badge variant={row.resolved ? "muted" : "coral"}>
              {row.resolved ? "Resolved" : "Open"}
            </Badge>
          </div>
          {row.stack ? (
            <pre className="bg-surface-muted/50 text-muted-foreground mt-3 max-h-40 overflow-auto rounded-lg p-3 text-xs">
              {row.stack}
            </pre>
          ) : null}
          {!row.resolved ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              disabled={pending}
              onClick={() => handleResolve(row.id)}
            >
              Mark resolved
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
