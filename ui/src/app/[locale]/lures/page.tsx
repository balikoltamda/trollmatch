import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppMain } from "@/components/layout/app-shell";
import { listPublicLures } from "@/modules/discovery/data/browse-lures";
import { LureResultsView } from "@/modules/discovery/components/lure-results-view";
import { routing, type AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type LuresPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
}: LuresPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "Lures" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function LuresPage({
  params,
  searchParams,
}: LuresPageProps) {
  const { locale } = await params;
  const { page } = await searchParams;

  if (!hasLocale(routing.locales, locale)) {
    return null;
  }

  setRequestLocale(locale);

  const pageNum = Math.max(1, Number(page) || 1);
  const result = await listPublicLures({ page: pageNum });
  const t = await getTranslations("Lures");

  return (
    <AppMain>
      <LureResultsView
        locale={locale as AppLocale}
        result={result}
        title={t("title")}
        description={t("description")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
        verifiedLabel={t("verified")}
        resultsLabel={t("resultsCount", { count: result.total })}
        pageLabel={t("pagination")}
        previousLabel={t("previous")}
        nextLabel={t("next")}
        basePath="/lures"
      />
    </AppMain>
  );
}
