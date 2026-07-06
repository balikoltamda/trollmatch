import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppMain } from "@/components/layout/app-shell";
import { getSpeciesDetailResult } from "@/modules/discovery/data/species";
import { SpeciesDetailView } from "@/modules/discovery/components/species-detail-view";
import {
  ensureTaxonomyReferenceSeeds,
  getSpeciesTaxonomyProfile,
} from "@/modules/taxonomy";
import { UnavailablePage } from "@/modules/stability/components/unavailable-page";
import { routing, type AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

export const dynamic = "force-dynamic";

type SpeciesDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: SpeciesDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const result = await getSpeciesDetailResult(slug);
  if (result.status !== "ok") {
    return {};
  }

  const name = pickLocalized(result.data.name, locale as AppLocale);
  const t = await getTranslations({ locale, namespace: "Species" });

  return {
    title: t("meta.detailTitle", { name }),
    description: t("meta.detailDescription", {
      name,
      count: result.data.lureCount,
    }),
  };
}

export default async function SpeciesDetailPage({
  params,
}: SpeciesDetailPageProps) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  await ensureTaxonomyReferenceSeeds();

  const result = await getSpeciesDetailResult(slug);

  if (result.status === "not_found") {
    notFound();
  }

  const t = await getTranslations("Stability");

  if (result.status === "unavailable") {
    return (
      <AppMain>
        <UnavailablePage
          title={t("unavailable.title")}
          description={t("unavailable.description")}
          homeLabel={t("notFound.home")}
          retryLabel={t("error.retry")}
          retryHref={`/species/${slug}`}
        />
      </AppMain>
    );
  }

  const taxonomy = await getSpeciesTaxonomyProfile(slug);

  return (
    <AppMain>
      <SpeciesDetailView
        locale={locale as AppLocale}
        species={result.data}
        taxonomy={taxonomy}
      />
    </AppMain>
  );
}
