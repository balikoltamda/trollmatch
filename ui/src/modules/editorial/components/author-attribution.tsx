import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAuthorBySlug } from "@/modules/editorial/data/authors";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type AuthorAttributionProps = {
  authorSlug: string;
  locale: AppLocale;
  reviewedAt?: string | null;
  className?: string;
};

export async function AuthorAttribution({
  authorSlug,
  locale,
  reviewedAt,
  className,
}: AuthorAttributionProps) {
  const t = await getTranslations("Editorial");
  const author = getAuthorBySlug(authorSlug);

  if (!author) {
    return null;
  }

  const name = pickLocalized(author.name, locale);
  const role = pickLocalized(author.role, locale);

  return (
    <p className={className ?? "text-muted-foreground text-sm"}>
      {t("writtenBy")}{" "}
      {author.profileReady ? (
        <Link
          href={`/authors/${author.slug}`}
          className="text-foreground font-medium hover:underline"
        >
          {name}
        </Link>
      ) : (
        <span className="text-foreground font-medium">{name}</span>
      )}
      <span className="text-muted-foreground"> · {role}</span>
      {reviewedAt ? (
        <span className="text-muted-foreground">
          {" "}
          · {t("reviewed")}{" "}
          {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
            new Date(reviewedAt),
          )}
        </span>
      ) : null}
    </p>
  );
}
