import { prisma } from "@/lib/prisma";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import {
  StudioTable,
  StudioTd,
  StudioTh,
} from "@/modules/studio/components/studio-ui";

export const dynamic = "force-dynamic";

export default async function StudioManufacturersPage() {
  const manufacturers = await prisma.manufacturer.findMany({
    where: { deletedAt: null },
    orderBy: { nameEn: "asc" },
    include: {
      _count: { select: { lureModels: true } },
    },
  });

  return (
    <>
      <StudioPageHeader
        title="Manufacturers"
        description="Catalog manufacturers — product counts from live database."
      />
      <StudioPageBody>
        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Name</StudioTh>
              <StudioTh>Slug</StudioTh>
              <StudioTh>Country</StudioTh>
              <StudioTh>Products</StudioTh>
            </tr>
          </thead>
          <tbody>
            {manufacturers.map((m) => (
              <tr key={m.id}>
                <StudioTd>{m.nameEn}</StudioTd>
                <StudioTd>{m.slug}</StudioTd>
                <StudioTd>{m.countryCode ?? "—"}</StudioTd>
                <StudioTd>{m._count.lureModels}</StudioTd>
              </tr>
            ))}
          </tbody>
        </StudioTable>
      </StudioPageBody>
    </>
  );
}
