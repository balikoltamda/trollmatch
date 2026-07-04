import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { ProductEditor } from "@/modules/studio/components/product-editor";
import {
  getProductEditorData,
  listSpeciesOptions,
  listTechniqueOptions,
} from "@/modules/studio/data/product-detail";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudioProductEditorPage({ params }: PageProps) {
  const { id } = await params;

  const [product, techniqueOptions, speciesOptions] = await Promise.all([
    getProductEditorData(id),
    listTechniqueOptions(),
    listSpeciesOptions(),
  ]);

  if (!product) notFound();

  return (
    <>
      <StudioPageHeader
        title="Product editor"
        description="On the box (read-only) · canonical (editable) · editor notes (Balık Oltamda)."
        actions={
          <Link
            href="/studio/products"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Back to products
          </Link>
        }
      />
      <StudioPageBody>
        <ProductEditor
          product={product}
          techniqueOptions={techniqueOptions}
          speciesOptions={speciesOptions}
        />
      </StudioPageBody>
    </>
  );
}
