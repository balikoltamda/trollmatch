import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { AttentionInbox } from "@/modules/studio/components/attention-inbox";
import { StudioDashboardPanel } from "@/modules/studio/components/studio-dashboard-panel";
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
        title="Studio"
        description="Live catalog health, import activity, and editorial items needing review."
      />
      <StudioPageBody>
        <StudioDashboardPanel />

        <div className="mt-12 border-t border-border/50 pt-10">
          <h2 className="text-foreground mb-2 text-lg font-semibold">
            Editorial inbox
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            {total} item{total === 1 ? "" : "s"} need your attention — verify
            before publishing.
          </p>
          <AttentionInbox items={items} />
        </div>
      </StudioPageBody>
    </>
  );
}
