"use client";

import { DiscoverySearchForm } from "@/modules/discovery/components/discovery-search-form";

type HeaderSearchProps = {
  placeholder: string;
  ariaLabel: string;
};

export function HeaderSearch({ placeholder, ariaLabel }: HeaderSearchProps) {
  return (
    <div className="hidden w-full max-w-xs md:block lg:max-w-sm">
      <DiscoverySearchForm
        placeholder={placeholder}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}
