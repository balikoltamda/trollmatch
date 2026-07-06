import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PublicKnowledgeSearchResult } from "@/modules/knowledge-pipeline/types";
import { KNOWLEDGE_SOURCE_TYPE_LABELS } from "@/modules/knowledge-pipeline/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type KnowledgeSearchResultsProps = {
  locale: AppLocale;
  result: PublicKnowledgeSearchResult;
};

export async function KnowledgeSearchResults({
  locale,
  result,
}: KnowledgeSearchResultsProps) {
  if (!result.query || result.rows.length === 0) {
    return null;
  }

  const t = await getTranslations("Knowledge");

  return (
    <div className="mb-10">
      <h2 className="text-foreground mb-4 text-xl font-semibold">
        {t("searchSectionTitle")}
      </h2>
      <p className="text-muted-foreground mb-4 text-sm">
        {t("searchSectionDescription")}
      </p>
      <ul className="space-y-3">
        {result.rows.map((card) => (
          <li
            key={card.id}
            className="border-border bg-surface-muted/30 rounded-xl border px-4 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-foreground text-sm font-medium">
                  {pickLocalized(card.title, locale)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {pickLocalized(
                    KNOWLEDGE_SOURCE_TYPE_LABELS[card.sourceType],
                    locale,
                  )}{" "}
                  · {pickLocalized(card.sourceName, locale)}
                </p>
              </div>
              <Badge variant="muted">Score {card.sourceScore}</Badge>
            </div>
            {card.aiSummary ? (
              <p className="text-muted-foreground mt-2 text-sm">
                {pickLocalized(card.aiSummary, locale)}
              </p>
            ) : null}
            <a
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ocean mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              <ExternalLink className="size-3.5" />
              {t("viewOriginal")}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
