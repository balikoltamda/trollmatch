import { createHash } from "node:crypto";
import type { CanonicalLureImport } from "@/modules/import/core/canonical-lure";

function stableStringify(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as object).sort());
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export type DigitalTwinHashes = {
  manufacturerVersionHash: string;
  contentHash: string;
  imageHash: string;
  technologyHash: string;
  specificationHash: string;
};

/** Compute content fingerprints for digital twin change detection. */
export function computeDigitalTwinHashes(
  incoming: CanonicalLureImport,
  sourceUrl?: string,
): DigitalTwinHashes {
  const model = incoming.model;
  const specPayload = {
    bodyType: model.bodyType,
    buoyancy: model.buoyancy,
    divingDepth: model.divingDepth,
    actions: model.actions,
    trollingSpeed: model.trollingSpeed,
    coatingType: model.coatingType,
    hooks: model.hooks,
    splitRings: model.splitRings,
    variants: incoming.variants.map((v) => ({
      slug: v.slug,
      lengthMm: v.sizes?.[0]?.lengthMm,
      weightG: v.weights?.[0]?.weightG,
    })),
  };

  const images = [
    ...(model.images ?? []),
    ...incoming.variants.flatMap((v) => v.images ?? []),
  ].map((img) => img.url);

  const technologies = (model.technologies ?? []).map((t) => t.slug).sort();

  const contentPayload = {
    name: model.name,
    shortDescription: model.shortDescription,
    manufacturerNotes: model.manufacturerNotes,
    spec: specPayload,
    images,
    technologies,
    videos: model.videos ?? [],
    downloads: model.downloads ?? [],
  };

  const specificationHash = sha256(stableStringify(specPayload));
  const imageHash = sha256(images.sort().join("|"));
  const technologyHash = sha256(technologies.join("|"));
  const contentHash = sha256(stableStringify(contentPayload));
  const manufacturerVersionHash = sha256(
    `${sourceUrl ?? incoming.metadata.sourceRecordId ?? ""}:${contentHash}`,
  );

  return {
    manufacturerVersionHash,
    contentHash,
    imageHash,
    technologyHash,
    specificationHash,
  };
}

export function hashesChanged(
  existing: {
    contentHash?: string | null;
    imageHash?: string | null;
    technologyHash?: string | null;
    specificationHash?: string | null;
  },
  next: DigitalTwinHashes,
): boolean {
  return (
    existing.contentHash !== next.contentHash ||
    existing.imageHash !== next.imageHash ||
    existing.technologyHash !== next.technologyHash ||
    existing.specificationHash !== next.specificationHash
  );
}
