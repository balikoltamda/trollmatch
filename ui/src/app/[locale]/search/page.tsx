import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppMain } from "@/components/layout/app-shell";
import { listPublicLures } from "@/modules/discovery/data/browse-lures";
import { LureResultsView } from "@/modules/discovery/components/lure-results-view";
import { KnowledgeSearchResults } from "@/modules/knowledge-pipeline/components/knowledge-search-results";
import { searchPublicKnowledge } from "@/modules/knowledge-pipeline/data/public-knowledge";
import { SpeciesSearchResults } from "@/modules/taxonomy/components/species-search-results";
import { searchSpeciesByTaxonomy } from "@/modules/taxonomy/data/species-search";
import { routing, type AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; species?: string; page?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "Discovery" });
  const query = q?.trim();

  return {
    title: query ? t("meta.searchTitle", { query }) : t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = await params;
  const { q, species, page } = await searchParams;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const pageNum = Math.max(1, Number(page) || 1);
  const [result, knowledgeResult, speciesResult] = await Promise.all([
    listPublicLures({
      q: q ?? null,
      species: species ?? null,
      page: pageNum,
    }),
    searchPublicKnowledge({ q: q ?? null, page: pageNum }),
    searchSpeciesByTaxonomy(q ?? ""),
  ]);

  const t = await getTranslations("Discovery");

  const title = result.query
    ? t("searchTitle", { query: result.query })
    : t("title");

  const description = result.query
    ? t("searchDescription", { query: result.query })
    : t("description");

  const resultsLabel = t("resultsCount", { count: result.total });

  return (
    <AppMain>
      <SpeciesSearchResults
        locale={locale as AppLocale}
        result={speciesResult}
      />
      <KnowledgeSearchResults
        locale={locale as AppLocale}
        result={knowledgeResult}
      />
      <LureResultsView
        locale={locale as AppLocale}
        result={result}
        title={title}
        description={description}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
        verifiedLabel={t("verified")}
        resultsLabel={resultsLabel}
        pageLabel={t("pagination")}
        previousLabel={t("previous")}
        nextLabel={t("next")}
        basePath="/search"
      />
    </AppMain>
  );
}
