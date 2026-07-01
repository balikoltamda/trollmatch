import { getTranslations } from "next-intl/server";
import { LureSection } from "@/features/lures/components/ui/lure-section";
import { localize } from "@/features/lures/services/get-lure-detail";
import type { LureTechnique } from "@/features/lures/types/lure-detail";
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
