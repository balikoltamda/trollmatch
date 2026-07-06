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
        "border-border/50 bg-card rounded-2xl border p-5 shadow-[0_1px_2px_oklch(0.28_0.04_255/0.03)]",
        className,
      )}
    >
      <p className="label-caps">{label}</p>
      <p className="text-foreground mt-3 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

export function StudioTable({
  className,
  ...props
}: ComponentProps<"table">) {
  return (
    <div className="border-border/50 bg-card overflow-hidden rounded-2xl border shadow-[0_1px_2px_oklch(0.28_0.04_255/0.03)]">
      <div className="overflow-x-auto">
        <table
          className={cn("w-full min-w-[48rem] text-left text-sm", className)}
          {...props}
        />
      </div>
    </div>
  );
}

export function StudioTh({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "text-muted-foreground bg-muted/30 border-border/50 border-b px-5 py-3.5 text-left text-[0.6875rem] font-medium tracking-[0.12em] uppercase",
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
        "border-border/40 border-b px-5 py-4 align-middle text-sm last:border-b-0",
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
    <label className="block space-y-2">
      <span className="text-foreground text-sm font-medium">{label}</span>
      {children}
      {hint ? (
        <span className="text-muted-foreground block text-sm leading-relaxed">
          {hint}
        </span>
      ) : null}
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
        "border-input/80 bg-background focus-visible:ring-ocean/10 w-full rounded-xl border px-4 py-3 text-sm shadow-sm outline-none focus-visible:ring-4",
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
        "border-input/80 bg-background focus-visible:ring-ocean/10 h-10 w-full rounded-xl border px-4 text-sm shadow-sm outline-none focus-visible:ring-4",
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
        "border-input/80 bg-background focus-visible:ring-ocean/10 h-10 w-full rounded-xl border px-4 text-sm shadow-sm outline-none focus-visible:ring-4",
        className,
      )}
      {...props}
    />
  );
}
