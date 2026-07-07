import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { MediaLibraryPanel } from "@/modules/studio/components/media-library-panel";
import {
  countMediaLibrary,
  listMediaLibrary,
} from "@/modules/studio/media/data/media-library";

export const dynamic = "force-dynamic";

export default async function StudioMediaPage() {
  const [rows, counts] = await Promise.all([
    listMediaLibrary({ limit: 200 }),
    countMediaLibrary(),
  ]);

  return (
    <>
      <StudioPageHeader
        title="Media library"
        description="Upload, replace, and manage lure, species, and manufacturer assets. Cover and hero selections are never overwritten by imports."
      />
      <StudioPageBody>
        <MediaLibraryPanel rows={rows} counts={counts} />
      </StudioPageBody>
    </>
  );
}
