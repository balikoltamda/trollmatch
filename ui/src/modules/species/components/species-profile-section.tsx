import { getTranslations } from "next-intl/server";
import { InformationSourceBadge } from "@/modules/editorial/components/information-source-badge";
import type { SpeciesProfileView } from "@/modules/species/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesProfileSectionProps = {
  locale: AppLocale;
  profile: SpeciesProfileView;
};

function formatDepth(min: number | null, max: number | null): string | null {
  if (min !== null && max !== null) return `${min}–${max} m`;
  if (min !== null) return `≥ ${min} m`;
  if (max !== null) return `≤ ${max} m`;
  return null;
}

function formatWeightGrams(grams: number | null): string | null {
  if (grams === null) return null;
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${grams} g`;
}

export async function SpeciesProfileSection({
  locale,
  profile,
}: SpeciesProfileSectionProps) {
  const t = await getTranslations("SpeciesCompass");
  const description = profile.description
    ? pickLocalized(profile.description, locale)
    : null;
  const habitat = profile.habitat
    ? pickLocalized(profile.habitat, locale)
    : null;
  const distribution = profile.distribution
    ? pickLocalized(profile.distribution, locale)
    : null;
  const spawning = profile.spawning
    ? pickLocalized(profile.spawning, locale)
    : null;
  const conservation = profile.conservation
    ? pickLocalized(profile.conservation, locale)
    : null;
  const depth = formatDepth(profile.depthMinM, profile.depthMaxM);
  const maxWeight = formatWeightGrams(profile.maxWeightG);

  const facts: { label: string; value: string }[] = [];
  if (depth) facts.push({ label: t("depth"), value: depth });
  if (profile.maxLengthCm !== null) {
    facts.push({
      label: t("maxLength"),
      value: `${profile.maxLengthCm} cm`,
    });
  }
  if (maxWeight) facts.push({ label: t("maxWeight"), value: maxWeight });
  if (profile.iucnStatus) {
    facts.push({
      label: t("iucnStatus"),
      value: t(`iucn.${profile.iucnStatus}`),
    });
  }
  if (profile.faoAreas.length > 0) {
    facts.push({
      label: t("faoAreas"),
      value: profile.faoAreas.join(" · "),
    });
  }

  const hasBody =
    description ||
    habitat ||
    distribution ||
    spawning ||
    conservation ||
    facts.length > 0;

  if (!hasBody) return null;

  return (
    <section
      id="species-profile"
      className="border-border/50 bg-card rounded-2xl border p-6 sm:p-8"
    >
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {t("profileTitle")}
        </h2>
        <InformationSourceBadge source="editorial" />
      </header>

      {description ? (
        <p className="text-foreground text-base leading-relaxed">{description}</p>
      ) : null}

      {facts.length > 0 ? (
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="label-caps">{fact.label}</dt>
              <dd className="text-foreground mt-1 text-sm">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {habitat ? (
        <div className="mt-6">
          <h3 className="label-caps">{t("habitat")}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {habitat}
          </p>
        </div>
      ) : null}

      {distribution ? (
        <div className="mt-6">
          <h3 className="label-caps">{t("distribution")}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {distribution}
          </p>
        </div>
      ) : null}

      {spawning ? (
        <div className="mt-6">
          <h3 className="label-caps">{t("spawning")}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {spawning}
          </p>
        </div>
      ) : null}

      {conservation ? (
        <div className="mt-6">
          <h3 className="label-caps">{t("conservation")}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {conservation}
          </p>
        </div>
      ) : null}
    </section>
  );
}
