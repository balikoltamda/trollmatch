import Link from "next/link";
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
      lureModels: {
        where: { deletedAt: null },
        select: { lifecycleState: true },
      },
    },
  });

  return (
    <>
      <StudioPageHeader
        title="Manufacturers"
        description="Catalog manufacturers — open a hub for import history and review stats."
      />
      <StudioPageBody>
        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Name</StudioTh>
              <StudioTh>Slug</StudioTh>
              <StudioTh>Products</StudioTh>
              <StudioTh>Needs review</StudioTh>
              <StudioTh>Published</StudioTh>
              <StudioTh />
            </tr>
          </thead>
          <tbody>
            {manufacturers.map((m) => {
              const needsReview = m.lureModels.filter(
                (p) => p.lifecycleState === "PENDING_REVIEW",
              ).length;
              const published = m.lureModels.filter(
                (p) => p.lifecycleState === "PUBLISHED",
              ).length;
              return (
                <tr key={m.id}>
                  <StudioTd>{m.nameEn}</StudioTd>
                  <StudioTd>{m.slug}</StudioTd>
                  <StudioTd>{m._count.lureModels}</StudioTd>
                  <StudioTd>{needsReview}</StudioTd>
                  <StudioTd>{published}</StudioTd>
                  <StudioTd>
                    <Link
                      href={`/studio/manufacturers/${m.slug}`}
                      className="text-ocean text-sm hover:underline"
                    >
                      Open hub
                    </Link>
                  </StudioTd>
                </tr>
              );
            })}
          </tbody>
        </StudioTable>
      </StudioPageBody>
    </>
  );
}
