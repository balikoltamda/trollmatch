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
        title="Editorial inbox"
        description="Items needing review before publication — manufacturer source, catch reports, and Balık Oltamda verification status."
      />
      <StudioPageBody>
        <p className="text-muted-foreground mb-6 text-sm">
          {total} item{total === 1 ? "" : "s"} need your attention today — verify
          to raise trust scores before publishing.
        </p>

        <AttentionInbox items={items} />
      </StudioPageBody>
    </>
  );
}
