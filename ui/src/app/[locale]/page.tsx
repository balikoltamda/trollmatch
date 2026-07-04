import { setRequestLocale } from "next-intl/server";
import { HomeView } from "@/modules/home/components/home-view";
import { routing, type AppLocale } from "@/i18n/routing";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export { generateMetadata } from "./home-metadata";

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeView locale={locale as AppLocale} />;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
