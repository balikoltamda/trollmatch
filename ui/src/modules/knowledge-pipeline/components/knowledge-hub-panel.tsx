"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  approveKnowledgeItem,
  archiveKnowledgeItem,
  flagKnowledgeOutdated,
  logOpenKnowledgeSource,
  mergeKnowledgeItems,
  rejectKnowledgeItem,
} from "@/modules/knowledge-pipeline/actions/knowledge-actions";
import type { KnowledgeHubItem } from "@/modules/knowledge-pipeline/types";
import { KNOWLEDGE_SOURCE_TYPE_LABELS } from "@/modules/knowledge-pipeline/types";

const CONFIDENCE_VARIANT = {
  HIGH: "turquoise",
  MEDIUM: "muted",
  LOW: "coral",
} as const;

type KnowledgeHubPanelProps = {
  items: KnowledgeHubItem[];
};

function EntityChips({
  label,
  items,
}: {
  label: string;
  items: Array<{ slug: string; name: { en: string } }>;
}) {
  if (items.length === 0) return null;
  return (
    <span>
      {label}: {items.map((i) => i.name.en).join(", ")}
    </span>
  );
}

export function KnowledgeHubPanel({ items }: KnowledgeHubPanelProps) {
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
        Knowledge archive is empty. New sources will appear here for editorial review.
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
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ocean font-medium leading-snug underline-offset-2 hover:underline"
                  onClick={() => void logOpenKnowledgeSource(item.id, item.url)}
                >
                  {item.title.en}
                </a>
                <p className="text-muted-foreground text-xs">
                  {KNOWLEDGE_SOURCE_TYPE_LABELS[item.sourceType]?.en ?? item.sourceType}{" "}
                  · {item.sourceName.en}
                  {item.language ? ` · ${item.language}` : ""}
                  {item.region ? ` · ${item.region}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="muted">
                  Score {item.sourceScore}
                </Badge>
                <Badge variant="muted">{item.sourceScoreCategoryLabel}</Badge>
                <Badge variant={CONFIDENCE_VARIANT[item.confidence] ?? "muted"}>
                  {item.confidence}
                </Badge>
                <Badge variant="muted">{item.status}</Badge>
                {item.isDuplicate || item.hasTaxonomyConflict ? (
                  <Badge variant="coral">Duplicate / conflict</Badge>
                ) : null}
              </div>
            </div>

            {item.sourcePreview ? (
              <p className="text-muted-foreground mt-2 text-xs">
                <span className="text-foreground/70 font-medium uppercase tracking-wide">
                  Preview ·{" "}
                </span>
                {item.sourcePreview.en}
              </p>
            ) : null}

            {item.aiSummary ? (
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                <span className="text-foreground/70 text-xs font-medium uppercase tracking-wide">
                  AI summary ·{" "}
                </span>
                {item.aiSummary.en}
              </p>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm italic">
                AI summary pending — view original source to verify.
              </p>
            )}

            <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <EntityChips label="Species" items={item.relatedSpecies} />
              <EntityChips label="Lures" items={item.relatedLures} />
              <EntityChips label="Techniques" items={item.relatedTechniques} />
              <EntityChips label="Manufacturers" items={item.relatedManufacturers} />
              {item.evidenceCount > 0 ? (
                <span>{item.evidenceCount} references</span>
              ) : null}
              <span>
                Added {item.discoveredAt.toLocaleDateString("en-GB")}
              </span>
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
                View original source
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
                onClick={() =>
                  setMergePrimaryId((current) =>
                    current === item.id ? null : item.id,
                  )
                }
              >
                {mergePrimaryId === item.id ? "Cancel merge" : "Merge…"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runAction(() => archiveKnowledgeItem(item.id))}
              >
                Archive
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runAction(() => flagKnowledgeOutdated(item.id))}
              >
                Flag outdated
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
