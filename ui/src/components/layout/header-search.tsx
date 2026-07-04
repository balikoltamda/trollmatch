"use client";

import { useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type HeaderSearchProps = {
  placeholder: string;
  ariaLabel: string;
};

export function HeaderSearch({ placeholder, ariaLabel }: HeaderSearchProps) {
  const router = useRouter();

  return (
    <div className="relative hidden w-full max-w-xs md:block lg:max-w-sm">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-9 pl-9 text-sm"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            const value = (event.target as HTMLInputElement).value.trim();
            if (value) {
              router.push(`/lures/${encodeURIComponent(value.toLowerCase())}`);
            }
          }
        }}
      />
    </div>
  );
}
