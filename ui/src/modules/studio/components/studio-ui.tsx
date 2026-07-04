import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StudioStatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/70 bg-card rounded-xl border p-4 shadow-sm",
        className,
      )}
    >
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground mt-2 text-2xl font-semibold tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

export function StudioTable({
  className,
  ...props
}: ComponentProps<"table">) {
  return (
    <div className="border-border/70 bg-card overflow-hidden rounded-xl border shadow-sm">
      <table
        className={cn("w-full text-left text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function StudioTh({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "text-muted-foreground bg-muted/40 border-border/60 border-b px-4 py-2.5 text-xs font-medium tracking-wide uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function StudioTd({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "border-border/40 border-b px-4 py-3 align-middle last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

export function StudioField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-foreground text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="text-muted-foreground block text-xs">{hint}</span> : null}
    </label>
  );
}

export function StudioTextarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "border-input bg-background focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2",
        className,
      )}
      {...props}
    />
  );
}

export function StudioInput({
  className,
  ...props
}: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-input bg-background focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2",
        className,
      )}
      {...props}
    />
  );
}

export function StudioSelect({
  className,
  ...props
}: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-input bg-background focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2",
        className,
      )}
      {...props}
    />
  );
}
