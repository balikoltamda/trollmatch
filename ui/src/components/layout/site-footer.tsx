import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";

export async function SiteFooter() {
  const t = await getTranslations("Layout");

  return (
    <footer className="border-border/70 bg-card mt-auto border-t">
      <Container size="wide" className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <span
                className="bg-navy text-off-white flex size-9 items-center justify-center rounded-xl text-sm font-bold"
                aria-hidden
              >
                TM
              </span>
              <span className="text-foreground text-base font-semibold tracking-tight">
                {t("brandName")}
              </span>
            </div>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              {t("footerTagline")}
            </p>
          </div>

          <div>
            <h2 className="text-foreground mb-4 text-sm font-semibold">
              {t("footerExplore")}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("navHome")}
                </Link>
              </li>
              <li>
                <Link
                  href="/lures/laser-pro-190-dd"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("navLures")}
                </Link>
              </li>
              <li>
                <Link
                  href="/add-lure"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("navContribute")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-foreground mb-4 text-sm font-semibold">
              {t("footerPlatform")}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground">{t("moduleName")}</span>
              </li>
              <li>
                <span className="text-muted-foreground">{t("siteName")}</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-foreground mb-4 text-sm font-semibold">
              {t("footerTrust")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("footerDevelopedBy")}
            </p>
          </div>
        </div>

        <div className="border-border/60 mt-12 flex flex-col gap-2 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">{t("footerCopyright")}</p>
          <p className="text-muted-foreground text-xs">{t("footerRights")}</p>
        </div>
      </Container>
    </footer>
  );
}
