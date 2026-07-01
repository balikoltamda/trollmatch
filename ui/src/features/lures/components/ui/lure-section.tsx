import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LureSectionProps = {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function LureSection({
  id,
  title,
  description,
  children,
  className,
}: LureSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn(
        "border-border bg-card text-card-foreground scroll-mt-20 rounded-xl border p-4 sm:p-6",
        className,
      )}
    >
      <header className="mb-4 space-y-1">
        <h2
          id={`${id}-heading`}
          className="text-foreground text-lg font-semibold tracking-tight sm:text-xl"
        >
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
