import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export async function PageLoadingState() {
  const t = await getTranslations("Stability.loading");

  return (
    <Section spacing="default">
      <Container>
        <div
          className="animate-pulse space-y-6"
          aria-busy="true"
          aria-label={t("ariaLabel")}
        >
          <div className="bg-surface-muted h-10 w-2/3 max-w-md rounded-lg" />
          <div className="bg-surface-muted h-4 w-full max-w-xl rounded" />
          <div className="bg-surface-muted h-4 w-4/5 max-w-lg rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-border bg-surface-muted/50 h-48 rounded-xl border"
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
