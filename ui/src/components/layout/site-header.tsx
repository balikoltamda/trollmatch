import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeaderSearch } from "@/components/layout/header-search";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Container } from "@/components/ui/container";

const navLinkClass =
  "text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200";

export async function SiteHeader() {
  const t = await getTranslations("Layout");

  return (
    <header className="border-border/70 bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-50 border-b backdrop-blur-md">
      <Container size="wide">
        <div className="flex h-16 items-center gap-4 lg:gap-8">
          <Link
            href="/"
            className="focus-visible:ring-ring flex shrink-0 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
          >
            <span
              className="bg-navy text-off-white flex size-9 items-center justify-center rounded-xl text-sm font-bold tracking-tight"
              aria-hidden
            >
              TM
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="text-foreground block text-sm font-semibold tracking-tight">
                {t("brandName")}
              </span>
              <span className="text-muted-foreground block text-xs">
                {t("brandTagline")}
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label={t("navLabel")}
          >
            <Link href="/" className={navLinkClass}>
              {t("navHome")}
            </Link>
            <Link href="/lures/laser-pro-190-dd" className={navLinkClass}>
              {t("navLures")}
            </Link>
            <Link href="/add-lure" className={navLinkClass}>
              {t("navContribute")}
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <HeaderSearch
              placeholder={t("searchPlaceholder")}
              ariaLabel={t("searchAria")}
            />
            <LocaleSwitcher />
          </div>
        </div>
      </Container>
    </header>
  );
}
