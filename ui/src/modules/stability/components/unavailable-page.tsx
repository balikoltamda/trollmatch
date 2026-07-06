import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";

type UnavailablePageProps = {
  title: string;
  description: string;
  homeLabel: string;
  retryLabel: string;
  retryHref?: string;
};

export function UnavailablePage({
  title,
  description,
  homeLabel,
  retryLabel,
  retryHref = "/",
}: UnavailablePageProps) {
  return (
    <Section spacing="default">
      <Container>
        <EmptyState title={title} description={description}>
          <nav className="flex flex-wrap justify-center gap-5 text-sm">
            <Link href="/" className="text-ocean font-medium hover:underline">
              {homeLabel}
            </Link>
            <Link
              href={retryHref}
              className="text-ocean font-medium hover:underline"
            >
              {retryLabel}
            </Link>
          </nav>
        </EmptyState>
      </Container>
    </Section>
  );
}
