import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import {
  listApprovedKnowledgeForLureSlug,
  listApprovedKnowledgeForSpeciesSlug,
} from "@/modules/knowledge-pipeline/data/public-knowledge";
import {
  KNOWLEDGE_SOURCE_TYPE_LABELS,
  type PublicKnowledgeCard,
} from "@/modules/knowledge-pipeline/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type RelatedKnowledgeSectionProps =
  | { locale: AppLocale; lureSlug: string; speciesSlug?: never }
  | { locale: AppLocale; speciesSlug: string; lureSlug?: never };

function KnowledgeCard({
  card,
  locale,
  viewOriginalLabel,
}: {
  card: PublicKnowledgeCard;
  locale: AppLocale;
  viewOriginalLabel: string;
}) {
  const typeLabel = pickLocalized(
    KNOWLEDGE_SOURCE_TYPE_LABELS[card.sourceType],
    locale,
  );

  return (
    <li className="border-border rounded-lg border px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-medium leading-snug">
            {pickLocalized(card.title, locale)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {typeLabel} · {pickLocalized(card.sourceName, locale)}
          </p>
        </div>
        <Badge variant="muted">Score {card.sourceScore}</Badge>
      </div>
      {card.aiSummary ? (
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {pickLocalized(card.aiSummary, locale)}
        </p>
      ) : null}
      <a
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ocean mt-3 inline-flex items-center gap-1 text-sm font-medium hover:underline"
      >
        <ExternalLink className="size-3.5" />
        {viewOriginalLabel}
      </a>
    </li>
  );
}

export async function RelatedKnowledgeSection(props: RelatedKnowledgeSectionProps) {
  const t = await getTranslations("Knowledge");
  const cards =
    "lureSlug" in props && props.lureSlug
      ? await listApprovedKnowledgeForLureSlug(props.lureSlug, 6)
      : await listApprovedKnowledgeForSpeciesSlug(props.speciesSlug!, 6);

  if (cards.length === 0) {
    return null;
  }

  return (
    <LureSection
      id="related-knowledge"
      title={t("relatedTitle")}
      description={t("relatedDescription")}
    >
      <ul className="space-y-3">
        {cards.map((card) => (
          <KnowledgeCard
            key={card.id}
            card={card}
            locale={props.locale}
            viewOriginalLabel={t("viewOriginal")}
          />
        ))}
      </ul>
    </LureSection>
  );
}
