import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { SOURCE_LABELS } from "@/modules/studio/lib/suggestion-labels";
import { listCommunitySuggestions } from "@/modules/studio/data/attention-inbox";
import { ensureAttentionSuggestions } from "@/modules/studio/lib/suggestion-generator";

export const dynamic = "force-dynamic";

export default async function StudioCommunityPage() {
  await ensureAttentionSuggestions(40);
  const suggestions = await listCommunitySuggestions(50);

  return (
    <>
      <StudioPageHeader
        title="Community reports"
        description="Angler catch data and effectiveness claims — verify before they become canonical."
      />
      <StudioPageBody>
        {suggestions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No community suggestions pending verification.
          </p>
        ) : (
          <ul className="space-y-4">
            {suggestions.map((s) => (
              <li
                key={s.id}
                className="border-border/70 rounded-xl border px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link
                      href={`/studio/products/${s.lureModel.id}`}
                      className="hover:text-ocean font-medium"
                    >
                      {s.lureModel.nameEn}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {s.lureModel.manufacturer.nameEn}
                    </p>
                  </div>
                  <Badge variant="muted">{SOURCE_LABELS.COMMUNITY_REPORT}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium">{s.fieldLabel}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Suggested: {s.suggestedValue ?? "—"}
                </p>
                {s.reasoning ? (
                  <p className="text-muted-foreground mt-2 text-xs">{s.reasoning}</p>
                ) : null}
                <Link
                  href={`/studio/products/${s.lureModel.id}`}
                  className={buttonVariants({ size: "sm", className: "mt-3" })}
                >
                  Verify
                </Link>
              </li>
            ))}
          </ul>
        )}
      </StudioPageBody>
    </>
  );
}
