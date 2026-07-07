import { getTranslations } from "next-intl/server";
import { InformationSourceBadge } from "@/modules/editorial/components/information-source-badge";
import type { SpeciesClassificationView } from "@/modules/species/types";

type SpeciesClassificationSectionProps = {
  classification: SpeciesClassificationView;
};

const RANKS = [
  ["kingdom", "kingdom"],
  ["phylum", "phylum"],
  ["className", "class"],
  ["orderName", "order"],
  ["family", "family"],
  ["genus", "genus"],
] as const;

export async function SpeciesClassificationSection({
  classification,
}: SpeciesClassificationSectionProps) {
  const t = await getTranslations("SpeciesCompass");

  const rows = RANKS.flatMap(([key, labelKey]) => {
    const value = classification[key];
    if (!value?.trim()) return [];
    return [{ label: t(labelKey), value }];
  });

  if (rows.length === 0) return null;

  return (
    <section
      id="species-classification"
      className="border-border/50 bg-card surface-elevated rounded-2xl border p-6 sm:p-8"
    >
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {t("classificationTitle")}
        </h2>
        <InformationSourceBadge source="editorial" />
      </header>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="label-caps">{row.label}</dt>
            <dd className="text-foreground mt-1 text-sm italic">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
