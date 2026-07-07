import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { getTechnologyEncyclopediaEntry } from "@/modules/studio/data/technology-encyclopedia";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TechnologyEncyclopediaPage({ params }: PageProps) {
  const { id } = await params;
  const entry = await getTechnologyEncyclopediaEntry(id);
  if (!entry) notFound();

  return (
    <>
      <StudioPageHeader
        title={entry.nameEn}
        description={`Technology encyclopedia — ${entry.manufacturer.nameEn}`}
        actions={
          <Link
            href={`/studio/manufacturers/${entry.manufacturer.slug}`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Manufacturer hub
          </Link>
        }
      />
      <StudioPageBody>
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-4">
            {entry.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.imageUrl}
                alt={entry.nameEn}
                className="border-border/70 max-h-64 rounded-xl border object-contain"
              />
            ) : null}
            <div>
              <h2 className="text-sm font-semibold">Description (EN)</h2>
              <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                {entry.descriptionEn ?? "—"}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Description (TR)</h2>
              <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                {entry.descriptionTr ?? "—"}
              </p>
            </div>
            {entry.patentNote ? (
              <div>
                <h2 className="text-sm font-semibold">Patent</h2>
                <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                  {entry.patentNote}
                </p>
              </div>
            ) : null}
            {entry.images.length > 0 ? (
              <div>
                <h2 className="mb-3 text-sm font-semibold">Technology images</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {entry.images.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.url}
                      alt={img.altTextEn ?? entry.nameEn}
                      className="border-border/70 rounded-lg border object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
          <aside className="space-y-6">
            <section>
              <h2 className="mb-3 text-sm font-semibold">Products using technology</h2>
              <ul className="space-y-2 text-sm">
                {entry.products.length === 0 ? (
                  <li className="text-muted-foreground">No linked products yet.</li>
                ) : (
                  entry.products.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/studio/products/${product.id}`}
                        className="text-ocean hover:underline"
                      >
                        {product.nameEn}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </section>
            <section>
              <h2 className="mb-3 text-sm font-semibold">Related technologies</h2>
              <ul className="space-y-2 text-sm">
                {entry.relatedTechnologies.map((related) => (
                  <li key={related.id}>
                    <Link
                      href={`/studio/technologies/${related.id}`}
                      className="text-ocean hover:underline"
                    >
                      {related.nameEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </StudioPageBody>
    </>
  );
}
