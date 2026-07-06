import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
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
        <EmptyState title={title} description={description}>
          {children}
          <nav className="flex flex-wrap justify-center gap-5 text-sm">
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
        </EmptyState>
      </Container>
    </Section>
  );
}
