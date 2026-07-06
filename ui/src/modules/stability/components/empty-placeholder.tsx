import type { ReactNode } from "react";

type EmptyPlaceholderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function EmptyPlaceholder({
  title,
  description,
  children,
}: EmptyPlaceholderProps) {
  return (
    <div className="border-border bg-surface-muted/30 rounded-lg border px-4 py-6 text-center">
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
