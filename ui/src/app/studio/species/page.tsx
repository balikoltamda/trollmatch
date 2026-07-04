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

export default async function StudioSpeciesPage() {
  const species = await prisma.fishSpecies.findMany({
    where: { deletedAt: null },
    orderBy: { nameEn: "asc" },
    take: 100,
    include: {
      _count: { select: { lureLinks: true } },
    },
  });

  return (
    <>
      <StudioPageHeader
        title="Fish species"
        description="Taxonomy reference — linked to lure compatibility in the catalog."
      />
      <StudioPageBody>
        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Name</StudioTh>
              <StudioTh>Scientific</StudioTh>
              <StudioTh>Slug</StudioTh>
              <StudioTh>Lure links</StudioTh>
            </tr>
          </thead>
          <tbody>
            {species.map((s) => (
              <tr key={s.id}>
                <StudioTd>{s.nameEn}</StudioTd>
                <StudioTd>{s.scientificName}</StudioTd>
                <StudioTd>{s.slug}</StudioTd>
                <StudioTd>{s._count.lureLinks}</StudioTd>
              </tr>
            ))}
          </tbody>
        </StudioTable>
      </StudioPageBody>
    </>
  );
}
