import { MediaAssetVariantKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { countMediaAssetReferences } from "@/modules/studio/media/lib/media-health";
import { resolveMediaStorageStatus } from "@/modules/studio/media/lib/media-storage-status";
import type {
  MediaAssetKind,
  MediaLibraryFilter,
  MediaLibraryRow,
} from "@/modules/studio/media/types";

const DEFAULT_LIMIT = 200;

function rowStorageStatus(
  url: string,
  mediaAsset:
    | {
        id: string;
        variants: Array<{ kind: MediaAssetVariantKind }>;
      }
    | null
    | undefined,
) {
  const variantKinds = new Set(mediaAsset?.variants.map((v) => v.kind) ?? []);
  return resolveMediaStorageStatus({
    url,
    mediaAssetId: mediaAsset?.id ?? null,
    variantKinds,
  });
}

export async function listMediaLibrary(
  filter: MediaLibraryFilter = {},
): Promise<MediaLibraryRow[]> {
  const limit = filter.limit ?? DEFAULT_LIMIT;
  const kind = filter.kind ?? "all";

  const [lureRows, speciesRows, manufacturerRows] = await Promise.all([
    kind === "all" || kind === "lure"
      ? prisma.image.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            lureModel: { select: { id: true, slug: true, nameEn: true } },
            mediaAsset: { include: { variants: true } },
          },
        })
      : [],
    kind === "all" || kind === "species"
      ? prisma.speciesImage.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            fishSpecies: { select: { id: true, slug: true, nameEn: true } },
            mediaAsset: { include: { variants: true } },
          },
        })
      : [],
    kind === "all" || kind === "manufacturer"
      ? prisma.manufacturerImage.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            manufacturer: { select: { id: true, slug: true, nameEn: true } },
            mediaAsset: { include: { variants: true } },
          },
        })
      : [],
  ]);

  const rows: MediaLibraryRow[] = [
    ...lureRows.map((row) => ({
      id: row.id,
      kind: "lure" as const,
      entityId: row.lureModel.id,
      entitySlug: row.lureModel.slug,
      entityName: row.lureModel.nameEn,
      url: row.url,
      sourceUrl: row.sourceUrl,
      sha256Hash: row.sha256Hash,
      mediaAssetId: row.mediaAssetId,
      role: row.role,
      altTextEn: row.altTextEn,
      altTextTr: row.altTextTr,
      creditEn: row.creditEn,
      creditTr: row.creditTr,
      copyrightEn: row.copyrightEn,
      copyrightTr: row.copyrightTr,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      duplicateOf: null,
      storageStatus: rowStorageStatus(row.url, row.mediaAsset),
      referenceCount: 0,
    })),
    ...speciesRows.map((row) => ({
      id: row.id,
      kind: "species" as const,
      entityId: row.fishSpecies.id,
      entitySlug: row.fishSpecies.slug,
      entityName: row.fishSpecies.nameEn,
      url: row.url,
      sourceUrl: row.sourceUrl,
      sha256Hash: row.sha256Hash,
      mediaAssetId: row.mediaAssetId,
      role: row.role,
      altTextEn: row.altTextEn,
      altTextTr: row.altTextTr,
      creditEn: row.creditEn,
      creditTr: row.creditTr,
      copyrightEn: row.copyrightEn,
      copyrightTr: row.copyrightTr,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      duplicateOf: null,
      storageStatus: rowStorageStatus(row.url, row.mediaAsset),
      referenceCount: 0,
    })),
    ...manufacturerRows.map((row) => ({
      id: row.id,
      kind: "manufacturer" as const,
      entityId: row.manufacturer.id,
      entitySlug: row.manufacturer.slug,
      entityName: row.manufacturer.nameEn,
      url: row.url,
      sourceUrl: row.sourceUrl,
      sha256Hash: row.sha256Hash,
      mediaAssetId: row.mediaAssetId,
      role: row.role,
      altTextEn: row.altTextEn,
      altTextTr: row.altTextTr,
      creditEn: row.creditEn,
      creditTr: row.creditTr,
      copyrightEn: row.copyrightEn,
      copyrightTr: row.copyrightTr,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      duplicateOf: null,
      storageStatus: rowStorageStatus(row.url, row.mediaAsset),
      referenceCount: 0,
    })),
  ];

  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const hashFirstSeen = new Map<string, MediaLibraryRow>();
  const referenceCache = new Map<string, number>();

  for (const row of rows.slice(0, limit)) {
    if (row.mediaAssetId) {
      if (!referenceCache.has(row.mediaAssetId)) {
        referenceCache.set(
          row.mediaAssetId,
          await countMediaAssetReferences(row.mediaAssetId),
        );
      }
      row.referenceCount = referenceCache.get(row.mediaAssetId) ?? 0;
    }

    if (!row.sha256Hash) continue;

    const first = hashFirstSeen.get(row.sha256Hash);
    if (!first) {
      hashFirstSeen.set(row.sha256Hash, row);
      continue;
    }

    row.duplicateOf = {
      kind: first.kind,
      id: first.id,
      entityName: first.entityName,
    };
  }

  return rows.slice(0, limit);
}

export async function countMediaLibrary(): Promise<
  Record<MediaAssetKind | "total", number>
> {
  const [lure, species, manufacturer] = await Promise.all([
    prisma.image.count({ where: { deletedAt: null } }),
    prisma.speciesImage.count({ where: { deletedAt: null } }),
    prisma.manufacturerImage.count({ where: { deletedAt: null } }),
  ]);

  return {
    lure,
    species,
    manufacturer,
    total: lure + species + manufacturer,
  };
}
