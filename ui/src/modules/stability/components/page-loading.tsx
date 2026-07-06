import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export async function PageLoadingState() {
  const t = await getTranslations("Stability.loading");

  return (
    <Section spacing="default">
      <Container>
        <div
          className="animate-pulse space-y-10"
          aria-busy="true"
          aria-label={t("ariaLabel")}
        >
          <div className="space-y-4">
            <div className="bg-surface-muted h-12 w-2/3 max-w-lg rounded-xl" />
            <div className="bg-surface-muted h-5 w-full max-w-2xl rounded-lg" />
            <div className="bg-surface-muted h-5 w-4/5 max-w-xl rounded-lg" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="border-border/50 bg-surface-muted/40 h-56 rounded-2xl border"
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
