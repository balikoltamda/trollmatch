import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";

export const dynamic = "force-dynamic";

export default function StudioCommunityPage() {
  return (
    <>
      <StudioPageHeader
        title="Community"
        description="Catch reports and angler notes — read-only until moderation ships."
      />
      <StudioPageBody>
        <p className="text-muted-foreground text-sm">
          Community moderation will land in a later sprint. Product editor shows
          a read-only placeholder for now.
        </p>
      </StudioPageBody>
    </>
  );
}
