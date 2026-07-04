import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type InputProps = ComponentProps<"input">;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "border-input bg-card text-foreground placeholder:text-muted-foreground flex h-11 w-full rounded-xl border px-4 text-sm shadow-sm transition-colors duration-200 outline-none focus-visible:border-ocean focus-visible:ring-3 focus-visible:ring-ocean/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
