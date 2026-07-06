import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
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
        <div className="border-border bg-surface-muted/40 mx-auto max-w-lg rounded-xl border px-6 py-12 text-center">
          <h1 className="text-foreground text-2xl font-semibold">{title}</h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            {description}
          </p>
          <nav className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
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
        </div>
      </Container>
    </Section>
  );
}
