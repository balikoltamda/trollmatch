import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppMain } from "@/components/layout/app-shell";
import { listPublicSpecies } from "@/modules/discovery/data/species";
import { SpeciesIndexView } from "@/modules/discovery/components/species-index-view";
import { routing, type AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type SpeciesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: SpeciesPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "Species" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function SpeciesPage({ params }: SpeciesPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const species = await listPublicSpecies();

  return (
    <AppMain>
      <SpeciesIndexView locale={locale as AppLocale} species={species} />
    </AppMain>
  );
}
