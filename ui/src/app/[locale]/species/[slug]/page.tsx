import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppMain } from "@/components/layout/app-shell";
import { getSpeciesDetail } from "@/modules/discovery/data/species";
import { SpeciesDetailView } from "@/modules/discovery/components/species-detail-view";
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

  const species = await getSpeciesDetail(slug);
  if (!species) {
    return {};
  }

  const name = pickLocalized(species.name, locale as AppLocale);
  const t = await getTranslations({ locale, namespace: "Species" });

  return {
    title: t("meta.detailTitle", { name }),
    description: t("meta.detailDescription", {
      name,
      count: species.lureCount,
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

  const species = await getSpeciesDetail(slug);

  if (!species) {
    notFound();
  }

  return (
    <AppMain>
      <SpeciesDetailView locale={locale as AppLocale} species={species} />
    </AppMain>
  );
}
