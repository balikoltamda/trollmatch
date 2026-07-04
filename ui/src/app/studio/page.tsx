import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { AttentionInbox } from "@/modules/studio/components/attention-inbox";
import {
  countAttentionItems,
  getAttentionInbox,
} from "@/modules/studio/data/attention-inbox";

export const dynamic = "force-dynamic";

export default async function StudioDashboardPage() {
  const [items, total] = await Promise.all([
    getAttentionInbox(50),
    countAttentionItems(),
  ]);

  return (
    <>
      <StudioPageHeader
        title="What requires my attention today?"
        description="Balık Oltamda validates content — approve, reject, correct, or merge suggestions. You should not be typing thousands of products."
      />
      <StudioPageBody>
        <p className="text-muted-foreground mb-6 text-sm">
          {total} item{total === 1 ? "" : "s"} in your attention inbox · sorted
          by urgency (importer changes first, then community, then AI)
        </p>

        <AttentionInbox items={items} />

        <div className="text-muted-foreground mt-10 border-border/50 border-t pt-6 text-xs">
          <p className="font-medium">Editorial pipeline</p>
          <p className="mt-1">
            Manufacturer → Importer → AI enrichment → Community reports → AI
            summary → Editorial verification → Published
          </p>
        </div>
      </StudioPageBody>
    </>
  );
}
