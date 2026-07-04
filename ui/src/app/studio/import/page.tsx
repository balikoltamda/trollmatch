import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { ImportCenterTable } from "@/modules/studio/components/import-center-table";
import { getImportCenterRows } from "@/modules/studio/data/import-center";

export const dynamic = "force-dynamic";

export default async function StudioImportPage() {
  const rows = await getImportCenterRows();

  return (
    <>
      <StudioPageHeader
        title="Import Center"
        description="Manufacturer feeds — what landed from the box, ready for editorial review."
      />
      <StudioPageBody>
        <ImportCenterTable rows={rows} />
      </StudioPageBody>
    </>
  );
}
