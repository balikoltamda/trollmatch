"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  approveKnowledgeItem,
  ignoreKnowledgeItem,
  logOpenKnowledgeSource,
  mergeKnowledgeItems,
  rejectKnowledgeItem,
} from "@/modules/knowledge-pipeline/actions/knowledge-actions";
import type { KnowledgeInboxItem } from "@/modules/knowledge-pipeline/types";

const SOURCE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturer",
  COMMUNITY: "Community",
  YOUTUBE: "YouTube",
  FISHING_FORUM: "Forum",
  PUBLIC_ARTICLE: "Article",
  SCIENTIFIC_PUBLICATION: "Scientific",
  OTHER: "Other",
};

const CONFIDENCE_VARIANT = {
  HIGH: "turquoise",
  MEDIUM: "muted",
  LOW: "coral",
} as const;

type KnowledgeInboxPanelProps = {
  items: KnowledgeInboxItem[];
};

export function KnowledgeInboxPanel({ items }: KnowledgeInboxPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mergePrimaryId, setMergePrimaryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function runAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setMergePrimaryId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Action failed");
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Knowledge inbox is empty. Sources will appear here as the pipeline discovers trustworthy information.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {mergePrimaryId ? (
        <p className="bg-ocean/8 text-ocean rounded-lg px-3 py-2 text-sm">
          Select the duplicate finding to merge into the highlighted primary item.
        </p>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className={`border-border/70 rounded-xl border px-4 py-4 ${
              mergePrimaryId === item.id ? "ring-ocean ring-2" : ""
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium leading-snug">{item.title.en}</p>
                <p className="text-muted-foreground text-xs">
                  {SOURCE_LABELS[item.sourceType] ?? item.sourceType} ·{" "}
                  {item.sourceName.en}
                  {item.region ? ` · ${item.region}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={
                    CONFIDENCE_VARIANT[item.confidence] ?? "muted"
                  }
                >
                  {item.confidence}
                </Badge>
                {item.isDuplicate || item.hasTaxonomyConflict ? (
                  <Badge variant="coral">Duplicate / conflict</Badge>
                ) : null}
              </div>
            </div>

            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {item.snippet.en}
            </p>

            <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {item.relatedSpecies ? (
                <span>Species: {item.relatedSpecies.name}</span>
              ) : null}
              {item.relatedLure ? (
                <span>Lure: {item.relatedLure.name}</span>
              ) : null}
              {item.relatedTechnique ? (
                <span>Technique: {item.relatedTechnique.name}</span>
              ) : null}
              {item.evidenceCount > 0 ? (
                <span>{item.evidenceCount} evidence</span>
              ) : null}
              {item.suggestionCount > 0 ? (
                <span>{item.suggestionCount} suggestions</span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  window.open(item.url, "_blank", "noopener,noreferrer");
                  void logOpenKnowledgeSource(item.id, item.url);
                }}
              >
                <ExternalLink className="mr-1 size-3.5" />
                Open source
              </Button>
              <Button
                size="sm"
                disabled={pending}
                onClick={() => runAction(() => approveKnowledgeItem(item.id))}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runAction(() => rejectKnowledgeItem(item.id))}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runAction(() => ignoreKnowledgeItem(item.id))}
              >
                Ignore
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  setMergePrimaryId((current) =>
                    current === item.id ? null : item.id,
                  )
                }
              >
                {mergePrimaryId === item.id ? "Cancel merge" : "Merge…"}
              </Button>
            </div>

            {mergePrimaryId && mergePrimaryId !== item.id ? (
              <Button
                size="sm"
                variant="secondary"
                className="mt-2"
                disabled={pending}
                onClick={() =>
                  runAction(() => mergeKnowledgeItems(mergePrimaryId, item.id))
                }
              >
                Merge into primary
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
