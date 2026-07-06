import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppMain } from "@/components/layout/app-shell";
import { AuthorProfileView } from "@/modules/editorial/components/author-profile-view";
import { getAuthorBySlug } from "@/modules/editorial/data/authors";
import { routing, type AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type AuthorPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const author = getAuthorBySlug(slug);
  if (!author) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "Editorial.authorPage" });

  return {
    title: `${pickLocalized(author.name, locale as AppLocale)} — ${t("metaTitle")}`,
    description: pickLocalized(author.bio, locale as AppLocale),
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const author = getAuthorBySlug(slug);
  if (!author) {
    notFound();
  }

  return (
    <AppMain>
      <AuthorProfileView author={author} locale={locale as AppLocale} />
    </AppMain>
  );
}
