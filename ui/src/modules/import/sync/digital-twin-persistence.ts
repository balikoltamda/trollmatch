import type { PrismaClient } from "@/generated/prisma/client";
import type { DigitalTwinHashes } from "@/modules/import/sync/digital-twin-hashes";

export type PersistDigitalTwinInput = {
  lureModelId: string;
  manufacturerUrl: string;
  hashes: DigitalTwinHashes;
  hasPendingChanges: boolean;
  contentUnchanged?: boolean;
  syncedAt?: Date;
};

/** Persist digital twin metadata after manufacturer sync. */
export async function persistDigitalTwinMetadata(
  prisma: PrismaClient,
  input: PersistDigitalTwinInput,
): Promise<void> {
  const now = input.syncedAt ?? new Date();

  let syncStatus: "SYNCED" | "STALE" | "CHANGES_PENDING" | "NEVER_SYNCED" =
    "SYNCED";
  if (input.hasPendingChanges) {
    syncStatus = "CHANGES_PENDING";
  } else if (input.contentUnchanged) {
    syncStatus = "STALE";
  }

  await prisma.lureModel.update({
    where: { id: input.lureModelId },
    data: {
      manufacturerUrl: input.manufacturerUrl,
      lastManufacturerSyncAt: now,
      lastManufacturerCheckAt: now,
      lastSuccessfulImportAt: now,
      lastImportedAt: now,
      manufacturerVersionHash: input.hashes.manufacturerVersionHash,
      contentHash: input.hashes.contentHash,
      imageHash: input.hashes.imageHash,
      technologyHash: input.hashes.technologyHash,
      specificationHash: input.hashes.specificationHash,
      syncStatus,
    },
  });
}

/** Record a background check without applying changes. */
export async function recordManufacturerCheck(
  prisma: PrismaClient,
  lureModelId: string,
  options: {
    contentUnchanged: boolean;
    hashes?: DigitalTwinHashes;
    checkFailed?: boolean;
  },
): Promise<void> {
  await prisma.lureModel.update({
    where: { id: lureModelId },
    data: {
      lastManufacturerCheckAt: new Date(),
      ...(options.hashes
        ? {
            manufacturerVersionHash: options.hashes.manufacturerVersionHash,
            contentHash: options.hashes.contentHash,
            imageHash: options.hashes.imageHash,
            technologyHash: options.hashes.technologyHash,
            specificationHash: options.hashes.specificationHash,
          }
        : {}),
      syncStatus: options.checkFailed
        ? "CHECK_FAILED"
        : options.contentUnchanged
          ? "SYNCED"
          : "STALE",
    },
  });
}
