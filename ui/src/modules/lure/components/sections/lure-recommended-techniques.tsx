import { getTranslations } from "next-intl/server";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import { localize } from "@/modules/lure/services/get-lure-detail";
import type { LureTechnique } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

type LureRecommendedTechniquesProps = {
  techniques: LureTechnique[];
  locale: AppLocale;
};

export async function LureRecommendedTechniques({
  techniques,
  locale,
}: LureRecommendedTechniquesProps) {
  const t = await getTranslations("LureDetail");

  if (techniques.length === 0) {
    return null;
  }

  return (
    <LureSection
      id="techniques"
      title={t("sections.techniques")}
      description={t("sections.techniquesDescription")}
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {techniques.map((technique) => (
          <li
            key={technique.id}
            className="border-border bg-muted/40 text-foreground rounded-lg border px-3 py-2.5 text-sm font-medium"
          >
            {localize(technique.name, locale)}
          </li>
        ))}
      </ul>
    </LureSection>
  );
}
