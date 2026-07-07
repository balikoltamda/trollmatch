"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { StudioField, StudioInput } from "@/modules/studio/components/studio-ui";

type RegionSearchFormProps = {
  initialQuery: string;
  activeOnly: boolean;
};

export function RegionSearchForm({ initialQuery, activeOnly }: RegionSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  function applySearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    router.push(`/studio/regions?${params.toString()}`);
  }

  function toggleActiveOnly() {
    const params = new URLSearchParams(searchParams.toString());
    if (activeOnly) {
      params.delete("inactive");
    } else {
      params.set("inactive", "0");
    }
    router.push(`/studio/regions?${params.toString()}`);
  }

  return (
    <form
      onSubmit={applySearch}
      className="mb-6 flex flex-wrap items-end gap-4"
    >
      <StudioField label="Search regions">
        <StudioInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, slug, or code…"
        />
      </StudioField>
      <button type="submit" className={buttonVariants({ size: "sm" })}>
        Search
      </button>
      <button
        type="button"
        className={buttonVariants({ size: "sm", variant: "outline" })}
        onClick={toggleActiveOnly}
      >
        {activeOnly ? "Show all" : "Active only"}
      </button>
    </form>
  );
}
