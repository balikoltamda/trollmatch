import type { PrismaClient } from "@/generated/prisma/client";
import {
  computeDigitalTwinHashes,
  hashesChanged,
} from "@/modules/import/sync/digital-twin-hashes";
import { recordManufacturerCheck } from "@/modules/import/sync/digital-twin-persistence";
import { fetchDuelProductCanonical } from "@/modules/import/sync/fetch-single-product";
import {
  resolveManufacturerProductSource,
} from "@/modules/import/sync/resolve-manufacturer-source";

export type ManufacturerBackgroundCheckResult = {
  lureModelId: string;
  changed: boolean;
  checkFailed: boolean;
  sourceUrl: string | null;
};

export type BackgroundCheckSchedule = {
  /** ISO interval hint for future cron — e.g. weekly. */
  intervalDays: number;
  enabled: boolean;
};

/** Future-ready schedule config — not wired to cron yet. */
export const DEFAULT_BACKGROUND_CHECK_SCHEDULE: BackgroundCheckSchedule = {
  intervalDays: 7,
  enabled: false,
};

/**
 * Check manufacturer page without applying changes.
 * Only notify editors when content hash differs (future notification hook).
 */
export async function checkManufacturerPage(
  prisma: PrismaClient,
  lureModelId: string,
  options: { fetchFn?: typeof fetch } = {},
): Promise<ManufacturerBackgroundCheckResult> {
  const row = await prisma.lureModel.findFirst({
    where: { id: lureModelId, deletedAt: null },
    select: {
      id: true,
      contentHash: true,
      imageHash: true,
      technologyHash: true,
      specificationHash: true,
      manufacturer: { select: { slug: true } },
      aliases: { where: { deletedAt: null }, select: { alias: true } },
    },
  });

  if (!row) {
    return { lureModelId, changed: false, checkFailed: true, sourceUrl: null };
  }

  const source = resolveManufacturerProductSource({
    manufacturerSlug: row.manufacturer.slug,
    aliases: row.aliases,
  });

  if (source.kind !== "duel_pid") {
    await recordManufacturerCheck(prisma, lureModelId, {
      contentUnchanged: true,
      checkFailed: true,
    });
    return { lureModelId, changed: false, checkFailed: true, sourceUrl: null };
  }

  try {
    const incoming = await fetchDuelProductCanonical(source.pid, options.fetchFn);
    const hashes = computeDigitalTwinHashes(incoming, source.url);
    const changed = hashesChanged(row, hashes);

    await recordManufacturerCheck(prisma, lureModelId, {
      contentUnchanged: !changed,
      hashes,
    });

    return {
      lureModelId,
      changed,
      checkFailed: false,
      sourceUrl: source.url,
    };
  } catch {
    await recordManufacturerCheck(prisma, lureModelId, {
      contentUnchanged: false,
      checkFailed: true,
    });
    return {
      lureModelId,
      changed: false,
      checkFailed: true,
      sourceUrl: source.url,
    };
  }
}

/** Batch entry point for future weekly manufacturer checks. */
export async function runScheduledManufacturerChecks(
  prisma: PrismaClient,
  lureModelIds: string[],
): Promise<ManufacturerBackgroundCheckResult[]> {
  const results: ManufacturerBackgroundCheckResult[] = [];
  for (const id of lureModelIds) {
    results.push(await checkManufacturerPage(prisma, id));
  }
  return results;
}
