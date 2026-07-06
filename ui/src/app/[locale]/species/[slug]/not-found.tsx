import { getTranslations } from "next-intl/server";
import { NotFoundPage } from "@/modules/stability/components/not-found-page";

export default async function SpeciesNotFound() {
  const t = await getTranslations("Stability");

  return (
    <NotFoundPage
      title={t("speciesNotFound.title")}
      description={t("speciesNotFound.description")}
      homeLabel={t("notFound.home")}
      browseLuresLabel={t("notFound.browseLures")}
      browseSpeciesLabel={t("notFound.browseSpecies")}
    />
  );
}
