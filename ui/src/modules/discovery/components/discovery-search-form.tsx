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
    <div className={cn("relative w-full", className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        name="q"
        defaultValue={defaultQuery}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn("pl-9", size === "lg" ? "h-12 text-base" : "h-9 text-sm")}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            submit((event.target as HTMLInputElement).value);
          }
        }}
      />
    </div>
  );
}
