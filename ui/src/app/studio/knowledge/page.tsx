import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { KnowledgeHubPanel } from "@/modules/knowledge-pipeline/components/knowledge-hub-panel";
import {
  getKnowledgeHubStats,
  listKnowledgeHub,
} from "@/modules/knowledge-pipeline/data/knowledge-hub";
import { ensureKnowledgePipelineSeeds } from "@/modules/knowledge-pipeline/data/seed-knowledge";

export const dynamic = "force-dynamic";

const SOURCE_ORDER = [
  "MANUFACTURER",
  "YOUTUBE",
  "FISHING_FORUM",
  "FISHING_BLOG",
  "SCIENTIFIC_PUBLICATION",
  "MAGAZINE",
  "PUBLIC_ARTICLE",
  "COMMUNITY",
  "OTHER",
] as const;

const SOURCE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturer",
  YOUTUBE: "YouTube",
  FISHING_FORUM: "Forums",
  FISHING_BLOG: "Blogs",
  SCIENTIFIC_PUBLICATION: "Scientific",
  MAGAZINE: "Magazine",
  PUBLIC_ARTICLE: "Articles",
  COMMUNITY: "Community",
  OTHER: "Other",
};

export default async function StudioKnowledgePage() {
  await ensureKnowledgePipelineSeeds();
  const [items, stats] = await Promise.all([
    listKnowledgeHub(80),
    getKnowledgeHubStats(),
  ]);

  return (
    <>
      <StudioPageHeader
        title="Knowledge Hub"
        description={`Verified fishing knowledge — indexed, connected, never mirrored. ${stats.pending} awaiting review · ${stats.approved} approved.`}
      />
      <StudioPageBody>
        <p className="text-muted-foreground mb-6 max-w-3xl text-sm leading-relaxed">
          Knowledge is everywhere. Trust is earned. TrollMatch discovers — Balık
          Oltamda verifies. We index trustworthy sources, connect them to
          species, lures and techniques, and always direct users to the original
          source. Photos and videos remain on their original platform.
        </p>

        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="border-border rounded-full border px-3 py-1">
            Pending: {stats.pending}
          </span>
          <span className="border-border rounded-full border px-3 py-1">
            Approved: {stats.approved}
          </span>
          <span className="border-border rounded-full border px-3 py-1">
            Archived: {stats.archived}
          </span>
          <span className="border-border rounded-full border px-3 py-1">
            Outdated: {stats.outdated}
          </span>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {SOURCE_ORDER.map((type) => {
            const count = stats.bySourceType[type] ?? 0;
            if (count === 0) return null;
            return (
              <span
                key={type}
                className="border-border bg-surface-muted/50 text-muted-foreground rounded-full border px-3 py-1 text-xs"
              >
                {SOURCE_LABELS[type]}: {count}
              </span>
            );
          })}
        </div>

        <KnowledgeHubPanel items={items} />
      </StudioPageBody>
    </>
  );
}
