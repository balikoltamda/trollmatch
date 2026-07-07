import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  CommunityConsensus,
  TrustLayer,
  TrustProfile,
  TrustScoreFactor,
} from "@/modules/trust/types";

const CONFIDENCE_TONE = {
  HIGH: "ocean",
  MEDIUM: "muted",
  LOW: "coral",
} as const;

type TrustSummaryProps = {
  profile: TrustProfile;
  compact?: boolean;
  className?: string;
};

export function TrustSummary({
  profile,
  compact = false,
  className,
}: TrustSummaryProps) {
  const scoreTone =
    profile.score >= 80
      ? "text-ocean"
      : profile.score >= 55
        ? "text-amber-600 dark:text-amber-400"
        : "text-coral";

  return (
    <div
      className={cn(
        "border-border/70 bg-card rounded-xl border shadow-sm",
        compact ? "p-4" : "p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {profile.headline}
          </p>
          <p className={cn("mt-2 text-3xl font-semibold tabular-nums", scoreTone)}>
            {profile.score}%
          </p>
          <p className="text-muted-foreground mt-2 max-w-prose text-sm">
            {profile.answer}
          </p>
          {profile.scoreBreakdown.length > 0 ? (
            <details className="mt-4">
              <summary className="text-ocean cursor-pointer text-sm font-medium">
                How is this score calculated?
              </summary>
              <TrustScoreBreakdown factors={profile.scoreBreakdown} />
            </details>
          ) : null}
        </div>
        {!compact ? (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                profile.editorialVerification.published ? "ocean" : "muted"
              }
            >
              {profile.editorialVerification.statusLabel}
            </Badge>
            {profile.pendingVerificationCount > 0 ? (
              <Badge variant="coral">
                {profile.pendingVerificationCount} pending
              </Badge>
            ) : (
              <Badge variant="turquoise">Verified</Badge>
            )}
          </div>
        ) : null}
      </div>

      {profile.communityConsensus && !compact ? (
        <CommunityConsensusBlock consensus={profile.communityConsensus} />
      ) : null}

      <div className={cn("space-y-3", compact ? "mt-4" : "mt-6")}>
        {(compact ? profile.layers.slice(0, 2) : profile.layers).map(
          (layer) => (
            <TrustLayerCard key={layer.id} layer={layer} compact={compact} />
          ),
        )}
      </div>
    </div>
  );
}

function TrustScoreBreakdown({ factors }: { factors: TrustScoreFactor[] }) {
  const grouped = factors.reduce<Map<string, TrustScoreFactor[]>>((map, factor) => {
    const key = factor.category ?? "Other";
    const list = map.get(key) ?? [];
    list.push(factor);
    map.set(key, list);
    return map;
  }, new Map());

  return (
    <div className="border-border/50 mt-3 space-y-3 rounded-lg border px-3 py-3">
      {[...grouped.entries()].map(([category, items]) => (
        <div key={category}>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {category}
          </p>
          <ul className="mt-1.5 space-y-1">
            {items.map((factor) => (
              <li
                key={`${category}-${factor.label}`}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span
                  className={cn(
                    factor.tone === "positive" && "text-foreground",
                    factor.tone === "negative" && "text-coral",
                    factor.tone === "neutral" && "text-muted-foreground",
                  )}
                >
                  {factor.delta > 0 ? "+ " : factor.delta < 0 ? "− " : ""}
                  {factor.label}
                </span>
                {factor.delta !== 0 ? (
                  <span
                    className={cn(
                      "shrink-0 tabular-nums font-medium",
                      factor.delta > 0 ? "text-ocean" : "text-coral",
                    )}
                  >
                    {factor.delta > 0 ? "+" : ""}
                    {factor.delta}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function CommunityConsensusBlock({
  consensus,
}: {
  consensus: CommunityConsensus;
}) {
  return (
    <div className="bg-muted/30 mt-4 rounded-lg px-4 py-3">
      <p className="text-xs font-medium tracking-wide uppercase">
        Angler reports
      </p>
      <p className="mt-1 text-sm">{consensus.summary}</p>
    </div>
  );
}

function TrustLayerCard({
  layer,
  compact,
}: {
  layer: TrustLayer;
  compact?: boolean;
}) {
  return (
    <div className="border-border/50 rounded-lg border px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{layer.title}</p>
        {layer.confidence ? (
          <Badge
            variant={
              CONFIDENCE_TONE[layer.confidence as keyof typeof CONFIDENCE_TONE] ??
              "muted"
            }
          >
            {layer.confidence}
          </Badge>
        ) : null}
        <Badge variant={layer.verified ? "ocean" : "muted"}>
          {layer.verified ? "Verified" : "Unverified"}
        </Badge>
      </div>
      <p className="text-muted-foreground mt-1 text-sm">{layer.summary}</p>

      {!compact && layer.evidence.length > 0 ? (
        <div className="mt-2">
          <p className="text-muted-foreground text-xs font-medium">Evidence</p>
          <ul className="text-muted-foreground mt-1 list-inside list-disc text-xs">
            {layer.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!compact && layer.provenance.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {layer.provenance.map((item) => (
            <p key={`${item.label}-${item.value}`} className="text-xs">
              <span className="text-muted-foreground">{item.label}: </span>
              <span>{item.value}</span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TrustScorePill({ score }: { score: number }) {
  const tone =
    score >= 80 ? "bg-ocean/10 text-ocean" : score >= 55 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-coral/10 text-coral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        tone,
      )}
    >
      {score}% verified
    </span>
  );
}
