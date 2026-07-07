"use client";

import type { DuplicateMatch } from "@/modules/studio/ai-review/types";

type DuplicateWarningBannerProps = {
  duplicates: DuplicateMatch[];
};

export function DuplicateWarningBanner({ duplicates }: DuplicateWarningBannerProps) {
  if (duplicates.length === 0) return null;

  return (
    <div className="border-coral/40 bg-coral/5 rounded-xl border px-4 py-3">
      <p className="text-coral text-sm font-semibold">
        Possible duplicate — do not create silently
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {duplicates.map((dup) => (
          <li key={`${dup.entityId}-${dup.matchKind}-${dup.matchedOn}`}>
            <span className="font-medium">{dup.label}</span>
            <span className="text-muted-foreground">
              {" "}
              — matched on &quot;{dup.matchedOn}&quot; ({dup.matchKind},{" "}
              {dup.similarityPct}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
