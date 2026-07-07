import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import {
  StudioTable,
  StudioTd,
  StudioTh,
} from "@/modules/studio/components/studio-ui";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudioTechniquesPage() {
  const techniques = await prisma.technique.findMany({
    where: { deletedAt: null },
    orderBy: { nameEn: "asc" },
    include: {
      _count: { select: { lureTechniques: true } },
    },
  });

  return (
    <>
      <StudioPageHeader
        title="Techniques"
        description="Fishing methods linked to lure models."
        actions={
          <Link
            href="/studio/techniques/new"
            className={buttonVariants({ size: "sm" })}
          >
            New technique
          </Link>
        }
      />
      <StudioPageBody>
        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Name</StudioTh>
              <StudioTh>Slug</StudioTh>
              <StudioTh>Lure links</StudioTh>
            </tr>
          </thead>
          <tbody>
            {techniques.map((t) => (
              <tr key={t.id}>
                <StudioTd>{t.nameEn}</StudioTd>
                <StudioTd>{t.slug}</StudioTd>
                <StudioTd>{t._count.lureTechniques}</StudioTd>
              </tr>
            ))}
          </tbody>
        </StudioTable>
      </StudioPageBody>
    </>
  );
}
