import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

type NotFoundPageProps = {
  title: string;
  description: string;
  homeLabel: string;
  browseLuresLabel: string;
  browseSpeciesLabel: string;
  children?: ReactNode;
};

export function NotFoundPage({
  title,
  description,
  homeLabel,
  browseLuresLabel,
  browseSpeciesLabel,
  children,
}: NotFoundPageProps) {
  return (
    <Section spacing="default">
      <Container>
        <div className="border-border bg-surface-muted/40 mx-auto max-w-lg rounded-xl border px-6 py-12 text-center">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            404
          </p>
          <h1 className="text-foreground mt-2 text-2xl font-semibold">{title}</h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            {description}
          </p>
          {children}
          <nav className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/" className="text-ocean font-medium hover:underline">
              {homeLabel}
            </Link>
            <Link
              href="/lures"
              className="text-ocean font-medium hover:underline"
            >
              {browseLuresLabel}
            </Link>
            <Link
              href="/species"
              className="text-ocean font-medium hover:underline"
            >
              {browseSpeciesLabel}
            </Link>
          </nav>
        </div>
      </Container>
    </Section>
  );
}
