import type {
  CanonicalImage,
  CanonicalLureImport,
} from "@/modules/import/core/canonical-lure";
import { probeRemoteImageMetadata } from "@/modules/import/images/remote-image-probe";
import { resolvePublicImagePath } from "@/modules/studio/media/lib/media-asset-service";
import { ensureMediaAssetFromUrl } from "@/modules/studio/media/lib/media-asset-service";

export function isRemoteImageUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

export function isLocalPublicImagePath(url: string): boolean {
  const trimmed = url.trim();
  return trimmed.startsWith("/media/") || trimmed.startsWith("/lures/");
}

function normalizeRemoteUrl(image: CanonicalImage): string {
  return (image.sourcePageUrl ?? image.url).trim();
}

/** Import stage: metadata only — keep manufacturer URLs, probe type/dimensions when possible. */
export async function prepareImagesForLazyImport(
  images: CanonicalImage[],
  fetchFn: typeof fetch = fetch,
): Promise<CanonicalImage[]> {
  const prepared: CanonicalImage[] = [];

  for (const image of images) {
    if (isLocalPublicImagePath(image.url)) {
      prepared.push(image);
      continue;
    }

    const remoteUrl = normalizeRemoteUrl(image);
    if (!isRemoteImageUrl(remoteUrl)) {
      prepared.push(image);
      continue;
    }

    const probe = await probeRemoteImageMetadata(remoteUrl, fetchFn);
    prepared.push({
      ...image,
      url: remoteUrl,
      sourcePageUrl: remoteUrl,
      mimeType: probe.mimeType ?? image.mimeType,
      widthPx: probe.widthPx ?? image.widthPx,
      heightPx: probe.heightPx ?? image.heightPx,
    });
  }

  return prepared;
}

export async function prepareCanonicalImportImages(
  record: CanonicalLureImport,
  fetchFn: typeof fetch = fetch,
): Promise<CanonicalLureImport> {
  const modelImages = record.model.images
    ? await prepareImagesForLazyImport(record.model.images, fetchFn)
    : undefined;

  const variants = await Promise.all(
    record.variants.map(async (variant) => ({
      ...variant,
      images: variant.images
        ? await prepareImagesForLazyImport(variant.images, fetchFn)
        : undefined,
    })),
  );

  return {
    ...record,
    model: { ...record.model, images: modelImages },
    variants,
  };
}

/** Publish / manual download — fetch bytes and persist to Media Library. */
export async function downloadImportImageToLocal(
  url: string,
  options: {
    fetchFn?: typeof fetch;
    manufacturerId?: string | null;
  } = {},
): Promise<{
  url: string;
  sha256Hash: string;
  sourceUrl: string;
  mediaAssetId: string;
  mimeType: string;
  widthPx: number | null;
  heightPx: number | null;
}> {
  const trimmed = url.trim();
  const asset = await ensureMediaAssetFromUrl(trimmed, {
    fetchFn: options.fetchFn,
    manufacturerId: options.manufacturerId ?? null,
  });

  return {
    url: asset.publicUrl,
    sha256Hash: asset.sha256Hash,
    sourceUrl: asset.sourceUrl ?? trimmed,
    mediaAssetId: asset.mediaAssetId,
    mimeType: asset.mimeType,
    widthPx: asset.widthPx,
    heightPx: asset.heightPx,
  };
}

/** @deprecated Import uses lazy metadata — use downloadImportImageToLocal at publish time. */
export const resolveImportImageUrl = downloadImportImageToLocal;

/** @deprecated Use prepareCanonicalImportImages for import. */
export const hydrateCanonicalImportImages = prepareCanonicalImportImages;

/** @deprecated Use prepareImagesForLazyImport for import. */
export const hydrateImagesForPersistence = prepareImagesForLazyImport;

export { resolvePublicImagePath };
