"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  approveAllSuggestions,
  approveSuggestion,
  correctSuggestion,
  mergeSuggestions,
  rejectSuggestion,
} from "@/modules/studio/actions/suggestion-actions";
import { SOURCE_LABELS } from "@/modules/studio/lib/suggestion-labels";
import { StudioInput } from "@/modules/studio/components/studio-ui";
import type { EditorNoteConfidence } from "@/generated/prisma/client";

export type VerificationSuggestion = {
  id: string;
  kind: string;
  fieldLabel: string;
  fieldKey: string | null;
  currentValue: string | null;
  suggestedValue: string | null;
  confidence: EditorNoteConfidence;
  source: keyof typeof SOURCE_LABELS;
  reasoning: string | null;
  provenance: Record<string, unknown> | null;
};

type VerificationPanelProps = {
  lureModelId: string;
  productName: string;
  suggestions: VerificationSuggestion[];
};

const CONFIDENCE_TONE: Record<EditorNoteConfidence, "ocean" | "muted" | "coral"> =
  {
    HIGH: "ocean",
    MEDIUM: "muted",
    LOW: "coral",
  };

export function VerificationPanel({
  lureModelId,
  productName,
  suggestions,
}: VerificationPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctValue, setCorrectValue] = useState("");
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSelected, setMergeSelected] = useState<Set<string>>(new Set());
  const [mergeValue, setMergeValue] = useState("");

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string; count?: number }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage("error" in result && result.error ? result.error : "Action failed");
        return;
      }
      setMessage(
        "count" in result && result.count !== undefined
          ? `Approved ${result.count} suggestions.`
          : "Done.",
      );
      setCorrectingId(null);
      setMergeMode(false);
      setMergeSelected(new Set());
      router.refresh();
    });
  }

  if (suggestions.length === 0) {
    return (
      <div className="border-border/60 bg-muted/20 rounded-xl border px-6 py-8 text-center">
        <p className="font-medium">Nothing to verify on {productName}</p>
        <p className="text-muted-foreground mt-2 text-sm">
          All suggestions resolved. Trust score is ready — publish when confident.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-muted-foreground text-sm">
          {suggestions.length} suggestion{suggestions.length === 1 ? "" : "s"} awaiting verification
        </p>
        <button
          type="button"
          disabled={pending}
          className={buttonVariants({ size: "sm" })}
          onClick={() =>
            run(async () => {
              const result = await approveAllSuggestions(lureModelId);
              return result;
            })
          }
        >
          Approve all
        </button>
        <button
          type="button"
          disabled={pending || suggestions.length < 2}
          className={buttonVariants({ size: "sm", variant: "outline" })}
          onClick={() => setMergeMode((m) => !m)}
        >
          {mergeMode ? "Cancel merge" : "Merge mode"}
        </button>
      </div>

      {mergeMode ? (
        <div className="border-border/60 flex flex-wrap items-end gap-2 rounded-lg border p-3">
          <div className="min-w-64 flex-1">
            <p className="mb-1 text-xs font-medium">Merged value</p>
            <StudioInput
              value={mergeValue}
              onChange={(e) => setMergeValue(e.target.value)}
              placeholder="Value to apply from merged suggestions"
            />
          </div>
          <button
            type="button"
            disabled={pending || mergeSelected.size < 2 || !mergeValue.trim()}
            className={buttonVariants({ size: "sm" })}
            onClick={() => {
              const ids = Array.from(mergeSelected);
              const primaryId = ids[0]!;
              run(async () => {
                const result = await mergeSuggestions(
                  primaryId,
                  ids.slice(1),
                  mergeValue,
                );
                return result;
              });
            }}
          >
            Merge {mergeSelected.size} selected
          </button>
        </div>
      ) : null}

      {message ? (
        <p className="text-muted-foreground text-sm">{message}</p>
      ) : null}

      <ul className="space-y-4">
        {suggestions.map((s) => (
          <li
            key={s.id}
            className="border-border/70 rounded-xl border px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{s.fieldLabel}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant={CONFIDENCE_TONE[s.confidence]}>
                    {s.confidence} confidence
                  </Badge>
                  <Badge variant="muted">{SOURCE_LABELS[s.source]}</Badge>
                </div>
              </div>
              {mergeMode ? (
                <input
                  type="checkbox"
                  checked={mergeSelected.has(s.id)}
                  onChange={() => {
                    setMergeSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(s.id)) next.delete(s.id);
                      else next.add(s.id);
                      return next;
                    });
                  }}
                  aria-label={`Select ${s.fieldLabel} for merge`}
                />
              ) : null}
            </div>

            <div className="mt-3 grid gap-2 text-sm md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="bg-muted/40 rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs">Current</p>
                <p className="mt-1">{s.currentValue ?? "—"}</p>
              </div>
              <span className="text-muted-foreground text-center">→</span>
              <div className="bg-ocean/5 rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs">Suggested</p>
                <p className="mt-1">{s.suggestedValue ?? "—"}</p>
              </div>
            </div>

            {s.reasoning ? (
              <p className="text-muted-foreground mt-3 text-sm">
                <span className="text-foreground font-medium">Reasoning: </span>
                {s.reasoning}
              </p>
            ) : null}

            {s.provenance && Object.keys(s.provenance).length > 0 ? (
              <p className="text-muted-foreground mt-2 text-xs">
                <span className="font-medium">Source: </span>
                {Object.entries(s.provenance)
                  .map(([k, v]) => `${k}=${String(v)}`)
                  .join(" · ")}
              </p>
            ) : null}

            {correctingId === s.id ? (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="min-w-64 flex-1">
                  <StudioInput
                    value={correctValue}
                    onChange={(e) => setCorrectValue(e.target.value)}
                    placeholder="Your corrected value"
                  />
                </div>
                <button
                  type="button"
                  disabled={pending || !correctValue.trim()}
                  className={buttonVariants({ size: "sm" })}
                  onClick={() =>
                    run(async () => correctSuggestion(s.id, correctValue))
                  }
                >
                  Save correction
                </button>
                <button
                  type="button"
                  className={buttonVariants({ size: "sm", variant: "ghost" })}
                  onClick={() => setCorrectingId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className={buttonVariants({ size: "sm" })}
                  onClick={() => run(async () => approveSuggestion(s.id))}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  onClick={() => {
                    setCorrectingId(s.id);
                    setCorrectValue(s.suggestedValue ?? "");
                  }}
                >
                  Correct
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className={buttonVariants({ size: "sm", variant: "ghost" })}
                  onClick={() => run(async () => rejectSuggestion(s.id))}
                >
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground text-xs">
        Balık Oltamda validates — it does not write most content.{" "}
        <Link href="/studio" className="text-ocean hover:underline">
          Back to attention inbox
        </Link>
      </p>
    </div>
  );
}
