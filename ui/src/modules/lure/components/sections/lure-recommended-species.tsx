import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import { localize } from "@/modules/lure/services/get-lure-detail";
import type { LureSpecies } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LureRecommendedSpeciesProps = {
  species: LureSpecies[];
  locale: AppLocale;
};

const kindStyles: Record<LureSpecies["kind"], string> = {
  curated: "bg-primary/10 text-primary",
  marketing: "bg-muted text-muted-foreground",
  community: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export async function LureRecommendedSpecies({
  species,
  locale,
}: LureRecommendedSpeciesProps) {
  const t = await getTranslations("LureDetail");

  if (species.length === 0) {
    return null;
  }

  const kindLabels: Record<LureSpecies["kind"], string> = {
    curated: t("speciesKind.curated"),
    marketing: t("speciesKind.marketing"),
    community: t("speciesKind.community"),
  };

  return (
    <LureSection
      id="species"
      title={t("sections.species")}
      description={t("sections.speciesDescription")}
    >
      <ul className="flex flex-col gap-2">
        {species.map((item) => (
          <li
            key={item.id}
            className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
          >
            <Link
              href={`/species/${item.id}`}
              className="text-foreground font-medium hover:text-ocean transition-colors"
            >
              {localize(item.name, locale)}
            </Link>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium",
                kindStyles[item.kind],
              )}
            >
              {kindLabels[item.kind]}
            </span>
          </li>
        ))}
      </ul>
    </LureSection>
  );
}
