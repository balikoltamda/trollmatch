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

export default async function StudioMediaPage() {
  const images = await prisma.image.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      lureModel: { select: { slug: true, nameEn: true } },
    },
  });

  return (
    <>
      <StudioPageHeader
        title="Media library"
        description="Importer images and catalog media — latest 50 assets."
      />
      <StudioPageBody>
        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Product</StudioTh>
              <StudioTh>Role</StudioTh>
              <StudioTh>URL</StudioTh>
            </tr>
          </thead>
          <tbody>
            {images.map((img) => (
              <tr key={img.id}>
                <StudioTd>{img.lureModel.nameEn}</StudioTd>
                <StudioTd>{img.role}</StudioTd>
                <StudioTd className="max-w-md truncate text-xs">{img.url}</StudioTd>
              </tr>
            ))}
          </tbody>
        </StudioTable>
      </StudioPageBody>
    </>
  );
}
