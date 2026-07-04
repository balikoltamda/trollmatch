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
        title="Editorial verification"
        description="Approve evidence-backed suggestions to raise trust scores. Reject anything that does not hold up on the water."
      />
      <StudioPageBody>
        <AttentionInbox items={items} />
      </StudioPageBody>
    </>
  );
}
