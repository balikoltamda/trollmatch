import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppMain } from "@/components/layout/app-shell";
import { AddLureForm } from "@/modules/lure/components/add-lure/add-lure-form";
import { routing, type AppLocale } from "@/i18n/routing";

type AddLurePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: AddLurePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "AddLure" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/add-lure`,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/add-lure`]),
      ),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AddLurePage({ params }: AddLurePageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("AddLure");

  return (
    <AppMain>
      <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase sm:text-sm">
          {t("eyebrow")}
        </p>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-base">
          {t("description")}
        </p>
      </header>

      <AddLureForm
        locale={locale as AppLocale}
        labels={{
          imageTitle: t("fields.imageTitle"),
          imageDescription: t("fields.imageDescription"),
          imageHint: t("fields.imageHint"),
          manufacturer: t("fields.manufacturer"),
          model: t("fields.model"),
          variant: t("fields.variant"),
          color: t("fields.color"),
          placeholder: t("fields.placeholder"),
          emptyMessage: t("fields.emptyMessage"),
          save: t("save"),
          saveDisabledHint: t("saveDisabledHint"),
          previewTitle: t("preview.title"),
          previewEmptyTitle: t("preview.emptyTitle"),
          previewEmptyDescription: t("preview.emptyDescription"),
          previewImagePlaceholder: t("preview.imagePlaceholder"),
          notSelected: t("preview.notSelected"),
          identitySection: t("sections.identity"),
          identityDescription: t("sections.identityDescription"),
        }}
      />

      <p className="text-muted-foreground sr-only">{t("pageLandmark")}</p>
      </div>
    </AppMain>
  );
}
