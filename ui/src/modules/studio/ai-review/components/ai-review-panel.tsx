"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudioTextarea } from "@/modules/studio/components/studio-ui";
import {
  acceptAiSuggestion,
  acceptAllAiSuggestions,
  rejectAiSuggestion,
  rejectAllAiSuggestions,
} from "@/modules/studio/ai-review/actions/ai-review-actions";
import { AiQualityReport } from "@/modules/studio/ai-review/components/ai-quality-report";
import { AiReviewStatusBar } from "@/modules/studio/ai-review/components/ai-review-status-bar";
import { isMetaSuggestion } from "@/modules/studio/ai-review/lib/quality-report";
import { summarizeReviewStatus } from "@/modules/studio/ai-review/lib/status-summary";
import { AI_SOURCE_LABELS } from "@/modules/studio/ai-review/types";
import type { AiReviewSessionView, AiSuggestionView } from "@/modules/studio/ai-review/types";

type AiReviewPanelProps = {
  session: AiReviewSessionView | null;
  onAccepted?: (fieldKey: string, value: string) => void;
  readOnly?: boolean;
};

function confidenceTone(pct: number): "ocean" | "muted" | "coral" {
  if (pct >= 85) return "ocean";
  if (pct >= 60) return "muted";
  return "coral";
}

function SuggestionRow({
  suggestion,
  onAccepted,
  readOnly,
}: {
  suggestion: AiSuggestionView;
  onAccepted?: (fieldKey: string, value: string) => void;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(suggestion.suggestedValue);
  const [message, setMessage] = useState<string | null>(null);

  const resolved = suggestion.status !== "PENDING";
  const displayValue = suggestion.editedValue ?? suggestion.suggestedValue;

  function accept(value?: string) {
    startTransition(async () => {
      const result = await acceptAiSuggestion(suggestion.id, value);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (!isMetaSuggestion(result.fieldKey)) {
        onAccepted?.(result.fieldKey, result.value);
      }
      setEditing(false);
      router.refresh();
    });
  }

  function reject() {
    startTransition(async () => {
      const result = await rejectAiSuggestion(suggestion.id);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="border-border bg-surface-muted/20 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{suggestion.fieldLabel}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Source: {AI_SOURCE_LABELS[suggestion.source]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={confidenceTone(suggestion.confidencePct)}>
            {suggestion.confidencePct}% confidence
          </Badge>
          {resolved ? (
            <Badge variant={suggestion.status === "APPROVED" ? "ocean" : "muted"}>
              {suggestion.status === "APPROVED" ? "Accepted" : "Rejected"}
            </Badge>
          ) : null}
        </div>
      </div>

      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {suggestion.reasoning}
      </p>
      {suggestion.provenance &&
      typeof suggestion.provenance === "object" &&
      "impact" in suggestion.provenance ? (
        <p className="text-muted-foreground mt-1 text-xs">
          Impact: {String(suggestion.provenance.impact)}
          {"affectedFields" in suggestion.provenance &&
          Array.isArray(suggestion.provenance.affectedFields)
            ? ` · Fields: ${(suggestion.provenance.affectedFields as string[]).join(", ")}`
            : null}
        </p>
      ) : null}

      {editing && !resolved && !readOnly ? (
        <div className="mt-3 space-y-2">
          <StudioTextarea
            rows={4}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              className={buttonVariants({ size: "sm" })}
              onClick={() => accept(editValue)}
            >
              Accept edited
            </button>
            <button
              type="button"
              className={buttonVariants({ size: "sm", variant: "outline" })}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <pre className="bg-background mt-3 overflow-x-auto rounded-lg border p-3 text-xs whitespace-pre-wrap">
          {displayValue}
        </pre>
      )}

      {!resolved && !readOnly && !editing ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm" })}
            onClick={() => accept()}
          >
            Accept
          </button>
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm", variant: "outline" })}
            onClick={() => setEditing(true)}
          >
            Edit & accept
          </button>
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm", variant: "outline" })}
            onClick={reject}
          >
            Reject
          </button>
        </div>
      ) : null}

      {message ? <p className="text-coral mt-2 text-xs">{message}</p> : null}
    </li>
  );
}

export function AiReviewPanel({
  session,
  onAccepted,
  readOnly = false,
}: AiReviewPanelProps) {
  const router = useRouter();
  const [bulkPending, startBulk] = useTransition();

  if (!session || session.suggestions.length === 0) {
    return (
      <div className="border-border/60 bg-muted/10 rounded-xl border px-4 py-6 text-center">
        <p className="text-muted-foreground text-sm">
          No AI suggestions yet. Analysis runs automatically when you open an entity.
        </p>
      </div>
    );
  }

  const fieldSuggestions = session.suggestions.filter((s) => !isMetaSuggestion(s.fieldKey));
  const summary = summarizeReviewStatus(fieldSuggestions);
  const pending = fieldSuggestions.filter((s) => s.status === "PENDING");
  const resolved = fieldSuggestions.filter((s) => s.status !== "PENDING");

  function bulkAcceptAll() {
    if (!session) return;
    startBulk(async () => {
      await acceptAllAiSuggestions(session.id);
      router.refresh();
    });
  }

  function bulkRejectAll() {
    if (!session) return;
    startBulk(async () => {
      await rejectAllAiSuggestions(session.id);
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <AiQualityReport session={session} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">AI suggestions</h2>
        <AiReviewStatusBar summary={summary} />
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        AI assists — you verify. Suggestions never write to production until you accept.
        AI cannot publish.
      </p>

      {!readOnly && pending.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={bulkPending}
            className={buttonVariants({ size: "sm" })}
            onClick={bulkAcceptAll}
          >
            Accept all
          </button>
          <button
            type="button"
            disabled={bulkPending}
            className={buttonVariants({ size: "sm", variant: "outline" })}
            onClick={bulkRejectAll}
          >
            Reject all
          </button>
        </div>
      ) : null}

      {pending.length > 0 ? (
        <>
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Pending
          </h3>
          <ul className="space-y-3">
            {pending.map((suggestion) => (
              <SuggestionRow
                key={suggestion.id}
                suggestion={suggestion}
                onAccepted={onAccepted}
                readOnly={readOnly}
              />
            ))}
          </ul>
        </>
      ) : null}

      {resolved.length > 0 ? (
        <>
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Reviewed
          </h3>
          <ul className="space-y-3">
            {resolved.map((suggestion) => (
              <SuggestionRow key={suggestion.id} suggestion={suggestion} readOnly />
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
