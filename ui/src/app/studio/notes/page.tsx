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

export default async function StudioNotesPage() {
  const [withNotes, pendingWithoutNotes] = await Promise.all([
    prisma.lureEditorNote.findMany({
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: {
        lureModel: {
          select: { id: true, slug: true, nameEn: true, lifecycleState: true },
        },
      },
    }),
    prisma.lureModel.count({
      where: {
        deletedAt: null,
        lifecycleState: "PENDING_REVIEW",
        editorNote: null,
      },
    }),
  ]);

  return (
    <>
      <StudioPageHeader
        title="Editor notes"
        description="Balık Oltamda field notes — separate from importer data, never overwritten."
      />
      <StudioPageBody>
        <p className="text-muted-foreground mb-6 text-sm">
          {pendingWithoutNotes} products pending review without editor notes yet.
        </p>
        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Product</StudioTh>
              <StudioTh>State</StudioTh>
              <StudioTh>Confidence</StudioTh>
              <StudioTh>Updated</StudioTh>
            </tr>
          </thead>
          <tbody>
            {withNotes.length === 0 ? (
              <tr>
                <StudioTd colSpan={4} className="text-muted-foreground">
                  No editor notes yet.
                </StudioTd>
              </tr>
            ) : (
              withNotes.map((note) => (
                <tr key={note.id}>
                  <StudioTd>
                    <Link
                      href={`/studio/products/${note.lureModel.id}`}
                      className="hover:text-ocean font-medium"
                    >
                      {note.lureModel.nameEn}
                    </Link>
                  </StudioTd>
                  <StudioTd>{note.lureModel.lifecycleState}</StudioTd>
                  <StudioTd>{note.confidence}</StudioTd>
                  <StudioTd className="text-muted-foreground text-xs">
                    {note.updatedAt.toLocaleDateString()}
                  </StudioTd>
                </tr>
              ))
            )}
          </tbody>
        </StudioTable>
      </StudioPageBody>
    </>
  );
}
