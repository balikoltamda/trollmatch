import {
  ManufacturerProductStatus,
  Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

export type LifecycleReconcileResult = {
  missing: string[];
  discontinued: string[];
};

const DEFAULT_DISCONTINUED_THRESHOLD = 3;

/**
 * Mark manufacturer products not seen in the current batch as MISSING or DISCONTINUED.
 * Never deletes rows.
 */
export async function reconcileManufacturerLifecycle(
  prisma: PrismaClient,
  manufacturerSlug: string,
  observedLureModelIds: string[],
  options: {
    discontinuedThreshold?: number;
  } = {},
): Promise<LifecycleReconcileResult> {
  const threshold = options.discontinuedThreshold ?? DEFAULT_DISCONTINUED_THRESHOLD;

  const manufacturer = await prisma.manufacturer.findFirst({
    where: { slug: manufacturerSlug, deletedAt: null },
  });

  if (!manufacturer) {
    return { missing: [], discontinued: [] };
  }

  const unseenModels = await prisma.lureModel.findMany({
    where: {
      manufacturerId: manufacturer.id,
      deletedAt: null,
      id: { notIn: observedLureModelIds },
      manufacturerStatus: {
        in: [ManufacturerProductStatus.ACTIVE, ManufacturerProductStatus.MISSING],
      },
    },
    select: {
      id: true,
      slug: true,
      missingImportCount: true,
    },
  });

  const missing: string[] = [];
  const discontinued: string[] = [];

  for (const model of unseenModels) {
    const nextCount = model.missingImportCount + 1;
    const nextStatus =
      nextCount >= threshold
        ? ManufacturerProductStatus.DISCONTINUED
        : ManufacturerProductStatus.MISSING;

    await prisma.lureModel.update({
      where: { id: model.id },
      data: {
        missingImportCount: nextCount,
        manufacturerStatus: nextStatus,
      },
    });

    if (nextStatus === ManufacturerProductStatus.DISCONTINUED) {
      discontinued.push(model.slug);
    } else {
      missing.push(model.slug);
    }
  }

  return { missing, discontinued };
}

export function normalizeDecimal(value: Prisma.Decimal | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toString();
}

export function valuesEqual(
  left: string | number | Prisma.Decimal | null | undefined,
  right: string | number | Prisma.Decimal | null | undefined,
): boolean {
  if (left === right) {
    return true;
  }

  const normalizedLeft =
    left instanceof Prisma.Decimal ? left.toString() : left ?? null;
  const normalizedRight =
    right instanceof Prisma.Decimal ? right.toString() : right ?? null;

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  if (
    normalizedLeft === null ||
    normalizedLeft === undefined ||
    normalizedRight === null ||
    normalizedRight === undefined
  ) {
    return normalizedLeft === normalizedRight;
  }

  return String(normalizedLeft) === String(normalizedRight);
}

export function pickChangedFields<T extends Record<string, unknown>>(
  existing: T,
  next: Partial<T>,
  keys: Array<keyof T>,
): Partial<T> {
  const changed: Partial<T> = {};

  for (const key of keys) {
    if (!valuesEqual(existing[key] as string | number | null, next[key] as string | number | null)) {
      changed[key] = next[key];
    }
  }

  return changed;
}
