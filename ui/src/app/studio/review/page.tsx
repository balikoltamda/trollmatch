import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { AttentionInbox } from "@/modules/studio/components/attention-inbox";
import { getAttentionInbox } from "@/modules/studio/data/attention-inbox";

export const dynamic = "force-dynamic";

export default async function StudioReviewPage() {
  const items = await getAttentionInbox(100);

  return (
    <>
      <StudioPageHeader
        title="Verification queue"
        description="Same attention inbox — every item is a suggestion to approve, reject, correct, or merge."
      />
      <StudioPageBody>
        <AttentionInbox items={items} />
      </StudioPageBody>
    </>
  );
}
