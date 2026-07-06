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

const CONFIDENCE_TONE = {
  HIGH: "ocean",
  MEDIUM: "muted",
  LOW: "coral",
} as const;

export default async function StudioCommunityPage() {
  await ensureAttentionSuggestions(40);
  const suggestions = await listCommunitySuggestions(50);

  return (
    <>
      <StudioPageHeader
        title="Community consensus"
        description="Angler catch reports and effectiveness claims — verify evidence before they earn trust on the public site."
      />
      <StudioPageBody>
        <p className="text-muted-foreground mb-4 text-sm">
          <Link
            href="/studio/community/reports"
            className="text-ocean font-medium hover:underline"
          >
            Review catch reports →
          </Link>
        </p>
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
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="muted">{SOURCE_LABELS.COMMUNITY_REPORT}</Badge>
                    <Badge
                      variant={
                        CONFIDENCE_TONE[s.confidence as keyof typeof CONFIDENCE_TONE] ??
                        "muted"
                      }
                    >
                      {s.confidence} confidence
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium">{s.fieldLabel}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Suggested: {s.suggestedValue ?? "—"}
                </p>
                {s.reasoning ? (
                  <p className="text-muted-foreground mt-2 text-xs">
                    <span className="text-foreground font-medium">Evidence: </span>
                    {s.reasoning}
                  </p>
                ) : null}
                {s.provenance && typeof s.provenance === "object" ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    <span className="text-foreground font-medium">Provenance: </span>
                    {Object.entries(s.provenance as Record<string, unknown>)
                      .map(([k, v]) => `${k}=${String(v)}`)
                      .join(" · ")}
                  </p>
                ) : null}
                <Link
                  href={`/studio/products/${s.lureModel.id}`}
                  className={buttonVariants({ size: "sm", className: "mt-3" })}
                >
                  Verify & build trust
                </Link>
              </li>
            ))}
          </ul>
        )}
      </StudioPageBody>
    </>
  );
}
