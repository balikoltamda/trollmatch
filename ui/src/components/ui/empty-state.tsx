import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  title,
  description,
  children,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border/60 bg-card mx-auto flex max-w-lg flex-col items-center rounded-2xl border px-8 text-center shadow-sm",
        compact ? "py-10" : "py-14 sm:py-16",
        className,
      )}
    >
      <div
        className="bg-surface-muted mb-5 flex size-12 items-center justify-center rounded-2xl"
        aria-hidden
      >
        <span className="bg-ocean/20 size-2.5 rounded-full" />
      </div>
      <h2 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed sm:text-base">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
