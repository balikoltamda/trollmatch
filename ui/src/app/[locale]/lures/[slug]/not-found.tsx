import { getTranslations } from "next-intl/server";
import { NotFoundPage } from "@/modules/stability/components/not-found-page";

export default async function LureNotFound() {
  const t = await getTranslations("Stability");

  return (
    <NotFoundPage
      title={t("lureNotFound.title")}
      description={t("lureNotFound.description")}
      homeLabel={t("notFound.home")}
      browseLuresLabel={t("notFound.browseLures")}
      browseSpeciesLabel={t("notFound.browseSpecies")}
    />
  );
}
