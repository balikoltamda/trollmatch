import { permanentRedirect } from "next/navigation";
import { STUDIO_SOURCE_ARCHIVE_PATH } from "@/modules/studio/lib/studio-routes";

export default function StudioKnowledgeLegacyRedirect() {
  permanentRedirect(STUDIO_SOURCE_ARCHIVE_PATH);
}
