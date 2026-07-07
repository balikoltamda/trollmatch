import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { InformationSourceBadge } from "@/modules/editorial/components/information-source-badge";
import type { CatchReportSummary } from "@/modules/catch-report/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

import { regionLabel } from "@/modules/catch-report/lib/regions";

type SpeciesCatchReportsSectionProps = {
  locale: AppLocale;
  reports: CatchReportSummary[];
};

export async function SpeciesCatchReportsSection({
  locale,
  reports,
}: SpeciesCatchReportsSectionProps) {
  const t = await getTranslations("SpeciesCompass");
  const catchT = await getTranslations("CatchReport");

  if (reports.length === 0) return null;

  return (
    <section id="species-catch-reports">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            {t("catchReportsTitle")}
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {t("catchReportsDescription")}
          </p>
        </div>
        <InformationSourceBadge source="community" />
      </header>
      <ul className="space-y-3">
        {reports.map((report) => (
          <li
            key={report.id}
            className="border-border/50 bg-card rounded-xl border px-5 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/lures/${report.lureModelSlug}`}
                className="text-foreground hover:text-ocean text-sm font-medium"
              >
                {pickLocalized(report.lureModelName, locale)}
              </Link>
              <Badge variant="turquoise">{catchT("verified")}</Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {pickLocalized(regionLabel(report.region), locale)}{" "}
              · {report.month}/{report.year} ·{" "}
              {report.boatOrShore === "BOAT" ? catchT("boat") : catchT("shore")}{" "}
              · {catchT("catchCount", { count: report.catchCount })}
              {report.techniqueName
                ? ` · ${pickLocalized(report.techniqueName, locale)}`
                : ""}
            </p>
            {report.notes ? (
              <p className="text-foreground mt-2 text-sm leading-relaxed">
                {report.notes}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
