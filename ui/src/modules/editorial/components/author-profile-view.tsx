import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { AuthorProfile } from "@/modules/editorial/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type AuthorProfileViewProps = {
  author: AuthorProfile;
  locale: AppLocale;
};

export async function AuthorProfileView({
  author,
  locale,
}: AuthorProfileViewProps) {
  const t = await getTranslations("Editorial.authorPage");

  return (
    <Section spacing="default">
      <Container>
        <nav className="text-muted-foreground mb-10 text-sm" aria-label={t("breadcrumbLabel")}>
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                {t("breadcrumbHome")}
              </Link>
            </li>
            <li aria-hidden className="text-border">
              /
            </li>
            <li className="text-foreground font-medium">
              {pickLocalized(author.name, locale)}
            </li>
          </ol>
        </nav>

        <header className="page-header max-w-2xl">
          <p className="label-caps text-ocean">{pickLocalized(author.role, locale)}</p>
          <h1>{pickLocalized(author.name, locale)}</h1>
          <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
            {pickLocalized(author.bio, locale)}
          </p>
        </header>

        <p className="text-muted-foreground mt-12 max-w-xl text-sm leading-relaxed">
          {t("futureNotes")}
        </p>
      </Container>
    </Section>
  );
}
