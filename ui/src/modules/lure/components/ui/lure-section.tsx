import type { ReactNode } from "react";
import { InformationSourceBadge } from "@/modules/editorial/components/information-source-badge";
import type { InformationSourceType } from "@/modules/editorial/types";
import { cn } from "@/lib/utils";

type LureSectionProps = {
  id: string;
  title: string;
  description?: string;
  sourceType?: InformationSourceType;
  children: ReactNode;
  className?: string;
};

export function LureSection({
  id,
  title,
  description,
  sourceType,
  children,
  className,
}: LureSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn(
        "border-border/50 bg-card scroll-mt-24 rounded-2xl border p-6 shadow-[0_1px_2px_oklch(0.28_0.04_255/0.03)] sm:p-8 lg:p-10",
        className,
      )}
    >
      <header className="mb-6 max-w-2xl space-y-3 sm:mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id={`${id}-heading`}
            className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl"
          >
            {title}
          </h2>
          {sourceType ? <InformationSourceBadge source={sourceType} /> : null}
        </div>
        {description ? (
          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
