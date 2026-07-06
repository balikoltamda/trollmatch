import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import { CatchReportQuickForm } from "@/modules/catch-report/components/catch-report-quick-form";
import {
  getCatchReportFormContext,
  listApprovedCatchReportsForLure,
} from "@/modules/catch-report";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

const REGION_LABELS: Record<string, { en: string; tr: string }> = {
  aegean: { en: "Aegean", tr: "Ege" },
  bosphorus: { en: "Bosphorus & Marmara", tr: "Boğaz & Marmara" },
  mediterranean: { en: "Mediterranean", tr: "Akdeniz" },
  "northern-cyprus": { en: "Northern Cyprus", tr: "Kıbrıs" },
};

type LureCatchReportsSectionProps = {
  lureSlug: string;
  locale: AppLocale;
  variantSlug?: string;
};

export async function LureCatchReportsSection({
  lureSlug,
  locale,
  variantSlug,
}: LureCatchReportsSectionProps) {
  const t = await getTranslations("CatchReport");
  const [reports, formContext] = await Promise.all([
    listApprovedCatchReportsForLure(lureSlug, 8),
    getCatchReportFormContext(lureSlug),
  ]);

  return (
    <LureSection
      id="catch-reports"
      title={t("lureSection.title")}
      description={t("lureSection.description")}
      sourceType="community"
    >
      {reports.length > 0 ? (
        <ul className="mb-8 space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="border-border/50 bg-card rounded-xl border px-5 py-4 shadow-[0_1px_2px_oklch(0.28_0.04_255/0.03)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/species/${report.fishSpeciesSlug}`}
                  className="text-foreground hover:text-ocean text-sm font-medium"
                >
                  {pickLocalized(report.fishSpeciesName, locale)}
                </Link>
                <Badge variant="turquoise">{t("verified")}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {pickLocalized(
                  REGION_LABELS[report.region] ?? {
                    en: report.region,
                    tr: report.region,
                  },
                  locale,
                )}{" "}
                · {report.month}/{report.year} ·{" "}
                {report.boatOrShore === "BOAT" ? t("boat") : t("shore")} ·{" "}
                {t("catchCount", { count: report.catchCount })}
              </p>
              {report.notes ? (
                <p className="text-foreground mt-2 text-sm leading-relaxed">
                  {report.notes}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mb-8 text-base leading-relaxed">
          {t("lureSection.empty")}
        </p>
      )}

      {formContext ? (
        <div className="border-border/50 bg-surface-muted/30 rounded-2xl border p-6 sm:p-8">
          <CatchReportQuickForm
            context={formContext}
            locale={locale}
            defaultVariantSlug={variantSlug}
            labels={{
              title: t("form.title"),
              species: t("form.species"),
              variant: t("form.variant"),
              technique: t("form.technique"),
              region: t("form.region"),
              when: t("form.when"),
              boat: t("form.boat"),
              shore: t("form.shore"),
              catchCount: t("form.catchCount"),
              notes: t("form.notes"),
              notesPlaceholder: t("form.notesPlaceholder"),
              submit: t("form.submit"),
              submitting: t("form.submitting"),
              success: t("form.success"),
              errorGeneric: t("form.error"),
            }}
          />
        </div>
      ) : null}
    </LureSection>
  );
}
