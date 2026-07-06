import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { KnowledgeInboxPanel } from "@/modules/knowledge-pipeline/components/knowledge-inbox-panel";
import {
  getKnowledgeInboxStats,
  listKnowledgeInbox,
} from "@/modules/knowledge-pipeline/data/knowledge-inbox";
import { ensureKnowledgePipelineSeeds } from "@/modules/knowledge-pipeline/data/seed-knowledge";

export const dynamic = "force-dynamic";

const SOURCE_ORDER = [
  "MANUFACTURER",
  "YOUTUBE",
  "FISHING_FORUM",
  "SCIENTIFIC_PUBLICATION",
  "COMMUNITY",
  "PUBLIC_ARTICLE",
  "OTHER",
] as const;

const SOURCE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturer",
  YOUTUBE: "YouTube",
  FISHING_FORUM: "Forums",
  SCIENTIFIC_PUBLICATION: "Scientific",
  COMMUNITY: "Community trends",
  PUBLIC_ARTICLE: "Articles",
  OTHER: "Other",
};

export default async function StudioKnowledgePage() {
  await ensureKnowledgePipelineSeeds();
  const [items, stats] = await Promise.all([
    listKnowledgeInbox(60),
    getKnowledgeInboxStats(),
  ]);

  return (
    <>
      <StudioPageHeader
        title="Knowledge inbox"
        description={`Editorial workspace for discovered knowledge — sorted by confidence. ${stats.pending} awaiting review.`}
      />
      <StudioPageBody>
        <p className="text-muted-foreground mb-6 max-w-3xl text-sm leading-relaxed">
          The system discovers. The editor verifies. Community reports are
          valuable but optional — primary growth comes from manufacturer data,
          trusted public information, and future AI agents. No crawlers in this
          sprint.
        </p>

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

        <KnowledgeInboxPanel items={items} />
      </StudioPageBody>
    </>
  );
}
