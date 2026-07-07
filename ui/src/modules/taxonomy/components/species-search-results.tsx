import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { SpeciesSearchResult } from "@/modules/taxonomy/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesSearchResultsProps = {
  locale: AppLocale;
  result: SpeciesSearchResult;
};

export async function SpeciesSearchResults({
  locale,
  result,
}: SpeciesSearchResultsProps) {
  if (!result.query || result.hits.length === 0) {
    return null;
  }

  const t = await getTranslations("Taxonomy");

  return (
    <div className="border-border/60 mx-auto mb-10 max-w-5xl border-b px-4 pb-8 sm:px-6">
      <h2 className="text-foreground mb-4 text-xl font-semibold">
        {t("searchTitle")}
      </h2>
      <ul className="space-y-3">
        {result.hits.map((hit) => {
          const speciesSlug = locale === "tr" ? hit.slugTr : hit.slugEn;
          return (
          <li
            key={`${speciesSlug}-${hit.matchKind}`}
            className="border-border bg-surface-muted/30 rounded-xl border px-4 py-3"
          >
            <Link
              href={`/species/${speciesSlug}`}
              className="text-ocean text-sm font-medium hover:underline"
            >
              {pickLocalized(hit.preferredName, locale)}
            </Link>
            <p className="text-muted-foreground text-xs italic">
              {hit.scientificName}
            </p>
            {hit.disambiguation ? (
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {t("disambiguation", {
                  correct: pickLocalized(hit.disambiguation.primaryName, locale),
                })}{" "}
                {pickLocalized(hit.disambiguation.reason, locale)}
              </p>
            ) : null}
          </li>
          );
        })}
      </ul>
    </div>
  );
}
