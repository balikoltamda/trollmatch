import Link from "next/link";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";

export const dynamic = "force-dynamic";

export default function StudioSettingsPage() {
  return (
    <>
      <StudioPageHeader
        title="Settings"
        description="Studio configuration — auth and roles ship in a later sprint."
      />
      <StudioPageBody>
        <div className="border-border/70 bg-card max-w-lg space-y-3 rounded-xl border p-5 text-sm">
          <p>
            <span className="font-medium">Access:</span> single local admin (no
            auth gate in this sprint)
          </p>
          <p>
            <span className="font-medium">Public site:</span>{" "}
            <Link href="/tr" className="text-ocean hover:underline">
              /tr
            </Link>
          </p>
          <p className="text-muted-foreground">
            Authentication, roles, permissions, and notifications are planned
            for a future sprint.
          </p>
        </div>
      </StudioPageBody>
    </>
  );
}
