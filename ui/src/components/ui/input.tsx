import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type InputProps = ComponentProps<"input">;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "border-input/80 bg-card text-foreground placeholder:text-muted-foreground/80 flex h-11 w-full rounded-2xl border px-4 text-sm shadow-[0_1px_2px_oklch(0.28_0.04_255/0.03)] transition-[border-color,box-shadow] duration-200 outline-none focus-visible:border-ocean/50 focus-visible:ring-4 focus-visible:ring-ocean/10 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
