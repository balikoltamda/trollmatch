import { getTranslations } from "next-intl/server";
import { NotFoundPage } from "@/modules/stability/components/not-found-page";

export default async function LocaleNotFound() {
  const t = await getTranslations("Stability");

  return (
    <NotFoundPage
      title={t("notFound.title")}
      description={t("notFound.description")}
      homeLabel={t("notFound.home")}
      browseLuresLabel={t("notFound.browseLures")}
      browseSpeciesLabel={t("notFound.browseSpecies")}
    />
  );
}
