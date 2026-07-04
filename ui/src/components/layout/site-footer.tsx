import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";

const BALIK_OLTAMDA_URL = "https://balikoltamda.net";

export async function SiteFooter() {
  const t = await getTranslations("Layout");

  return (
    <footer className="border-border/60 bg-background mt-auto border-t">
      <Container size="wide" className="py-10 sm:py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="bg-navy text-off-white flex size-8 items-center justify-center rounded-lg text-xs font-bold tracking-tight"
                aria-hidden
              >
                TM
              </span>
              <span className="text-foreground text-sm font-semibold tracking-tight">
                {t("brandName")}
              </span>
            </div>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              {t("footerTagline")}
            </p>
          </div>

          <nav
            className="flex flex-wrap gap-x-8 gap-y-2 text-sm"
            aria-label={t("footerExplore")}
          >
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("navHome")}
            </Link>
            <Link
              href="/species"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("navSpecies")}
            </Link>
            <Link
              href="/lures"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("navLures")}
            </Link>
            <Link
              href="/add-lure"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("navContribute")}
            </Link>
          </nav>
        </div>

        <div className="border-border/50 mt-10 border-t pt-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={BALIK_OLTAMDA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group focus-visible:ring-ring inline-flex w-fit items-center gap-4 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
              aria-label={t("footerDeveloperAria")}
            >
              <Image
                src="/brand/balik-oltamda-logo.png"
                alt=""
                width={48}
                height={48}
                className="size-11 rounded-md object-contain ring-1 ring-border/40 transition-opacity duration-200 group-hover:opacity-100"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t("footerDeveloperLabel")}
                </span>
                <span className="text-foreground text-sm font-medium">
                  Balık Oltamda
                </span>
              </span>
            </a>

            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              {t("footerDevelopedBy")}
            </p>
          </div>

          <p className="text-muted-foreground mt-6 text-xs">
            {t("footerCopyright")} · {t("footerRights")}
          </p>
        </div>
      </Container>
    </footer>
  );
}
