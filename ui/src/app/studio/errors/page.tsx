import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { RuntimeErrorsPanel } from "@/modules/stability/components/runtime-errors-panel";
import {
  countUnresolvedErrors,
  listRuntimeErrors,
} from "@/modules/stability/data/runtime-errors";

export const dynamic = "force-dynamic";

export default async function StudioErrorsPage() {
  const [errors, unresolved] = await Promise.all([
    listRuntimeErrors(100),
    countUnresolvedErrors(),
  ]);

  return (
    <>
      <StudioPageHeader
        title="Runtime errors"
        description={`Server exceptions from public pages. ${unresolved} unresolved. Goal: zero 500s — visitors never see a Next.js error page.`}
      />
      <StudioPageBody>
        <RuntimeErrorsPanel errors={errors} />
      </StudioPageBody>
    </>
  );
}
