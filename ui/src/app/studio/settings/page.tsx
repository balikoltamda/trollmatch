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
        description="Studio access is protected by email/password authentication."
      />
      <StudioPageBody>
        <div className="border-border/70 bg-card max-w-lg space-y-3 rounded-xl border p-5 text-sm">
          <p>
            <span className="font-medium">Access:</span> sign in at{" "}
            <Link href="/studio/login" className="text-ocean hover:underline">
              /studio/login
            </Link>
          </p>
          <p>
            <span className="font-medium">Roles:</span> ADMIN, EDITOR, MODERATOR
            — provision users manually in the database.
          </p>
          <p>
            <span className="font-medium">Public site:</span>{" "}
            <Link href="/tr" className="text-ocean hover:underline">
              /tr
            </Link>
          </p>
        </div>
      </StudioPageBody>
    </>
  );
}
