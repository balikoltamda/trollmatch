import type { ReactNode } from "react";

type StudioPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function StudioPageHeader({
  title,
  description,
  actions,
}: StudioPageHeaderProps) {
  return (
    <div className="border-border/70 bg-background/90 sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-8 py-5 backdrop-blur-sm">
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StudioPageBody({ children }: { children: ReactNode }) {
  return <div className="flex-1 px-8 py-6">{children}</div>;
}
