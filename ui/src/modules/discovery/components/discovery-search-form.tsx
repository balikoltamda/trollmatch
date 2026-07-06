"use client";

import { useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DiscoverySearchFormProps = {
  defaultQuery?: string;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  size?: "default" | "lg";
};

export function DiscoverySearchForm({
  defaultQuery = "",
  placeholder,
  ariaLabel,
  className,
  size = "default",
}: DiscoverySearchFormProps) {
  const router = useRouter();

  function submit(raw: string) {
    const value = raw.trim();
    if (!value) {
      router.push("/lures");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <div
      className={cn(
        "relative w-full",
        size === "lg" && "max-w-2xl",
        className,
      )}
    >
      <Search
        className={cn(
          "text-muted-foreground/70 pointer-events-none absolute top-1/2 -translate-y-1/2",
          size === "lg" ? "left-5 size-5" : "left-4 size-4",
        )}
        aria-hidden
      />
      <Input
        type="search"
        name="q"
        defaultValue={defaultQuery}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          size === "lg"
            ? "h-14 rounded-2xl pl-12 text-base shadow-[0_1px_2px_oklch(0.28_0.04_255/0.04),0_8px_24px_oklch(0.28_0.04_255/0.04)]"
            : "h-11 pl-10 text-sm",
        )}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            submit((event.target as HTMLInputElement).value);
          }
        }}
      />
    </div>
  );
}
