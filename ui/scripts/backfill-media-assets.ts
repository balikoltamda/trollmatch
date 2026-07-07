import { resolve } from "node:path";
import { loadEnv } from "../src/lib/load-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { isRemoteImageUrl } from "../src/modules/import/images/persist-import-image";
import { ensureMediaAssetFromUrl } from "../src/modules/studio/media/lib/media-asset-service";

loadEnv({ cwd: resolve(import.meta.dirname, "..") });

function printUsage(): void {
  console.log(`Usage: npm run backfill:media-assets -- [options]

Options:
  --table <name>    lure | species | manufacturer | all (default: all)
  --limit <n>       Cap rows processed per table
  --dry-run         Report only — no database writes
  -h, --help        Show this help

Downloads manufacturer images, creates MediaAsset records with optimized
variants, and links entity image rows. Never overwrites editor HERO role.
Does not delete or replace manually uploaded local images.
`);
}

type TableKind = "lure" | "species" | "manufacturer";

type ImageRow = {
  id: string;
  url: string;
  sourceUrl: string | null;
  sha256Hash: string | null;
  mediaAssetId: string | null;
};

async function persistLink(
  prisma: PrismaClient,
  table: TableKind,
  row: ImageRow,
  asset: Awaited<ReturnType<typeof ensureMediaAssetFromUrl>>,
  dryRun: boolean,
): Promise<"updated" | "skipped"> {
  if (dryRun) {
    console.log(
      `DRY-RUN [${table}] ${row.id}: ${row.url} -> ${asset.publicUrl}`,
    );
    return "updated";
  }

  const data = {
    url: asset.publicUrl,
    sha256Hash: asset.sha256Hash,
    sourceUrl: row.sourceUrl ?? asset.sourceUrl,
    mediaAssetId: asset.mediaAssetId,
  };

  if (table === "lure") {
    await prisma.image.update({ where: { id: row.id }, data });
  } else if (table === "species") {
    await prisma.speciesImage.update({ where: { id: row.id }, data });
  } else {
    await prisma.manufacturerImage.update({ where: { id: row.id }, data });
  }

  console.log(`OK [${table}] ${row.id}: ${asset.publicUrl}`);
  return "updated";
}

async function localizeRow(
  prisma: PrismaClient,
  table: TableKind,
  row: ImageRow,
  manufacturerId: string | null,
  dryRun: boolean,
): Promise<"updated" | "skipped" | "failed"> {
  const remoteCandidate = isRemoteImageUrl(row.url)
    ? row.url
    : row.sourceUrl && isRemoteImageUrl(row.sourceUrl)
      ? row.sourceUrl
      : null;

  const localCandidate =
    !remoteCandidate && row.url.startsWith("/media/") ? row.url : null;

  if (!remoteCandidate && !localCandidate) {
    return "skipped";
  }

  if (row.mediaAssetId && !remoteCandidate) {
    return "skipped";
  }

  try {
    const asset = await ensureMediaAssetFromUrl(
      remoteCandidate ?? localCandidate ?? row.url,
      { manufacturerId },
    );
    return await persistLink(prisma, table, row, asset, dryRun);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL [${table}] ${row.id}: ${row.url} (${message})`);
    return "failed";
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printUsage();
    return;
  }

  const table = (() => {
    const idx = args.findIndex((arg) => arg === "--table");
    return idx >= 0 ? args[idx + 1] ?? "all" : "all";
  })();
  const limit = (() => {
    const idx = args.findIndex((arg) => arg === "--limit");
    return idx >= 0 ? Number.parseInt(args[idx + 1] ?? "", 10) : undefined;
  })();
  const dryRun = args.includes("--dry-run");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("FAIL: DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    if (table === "all" || table === "lure") {
      const lureImages = await prisma.image.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: limit,
        select: {
          id: true,
          url: true,
          sourceUrl: true,
          sha256Hash: true,
          mediaAssetId: true,
          lureModel: { select: { manufacturerId: true } },
        },
      });

      console.log(`Processing ${lureImages.length} lure image(s)...`);
      for (const image of lureImages) {
        const result = await localizeRow(
          prisma,
          "lure",
          image,
          image.lureModel.manufacturerId,
          dryRun,
        );
        if (result === "updated") updated += 1;
        else if (result === "skipped") skipped += 1;
        else failed += 1;
      }
    }

    if (table === "all" || table === "species") {
      const speciesImages = await prisma.speciesImage.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: limit,
        select: {
          id: true,
          url: true,
          sourceUrl: true,
          sha256Hash: true,
          mediaAssetId: true,
        },
      });

      console.log(`Processing ${speciesImages.length} species image(s)...`);
      for (const image of speciesImages) {
        const result = await localizeRow(prisma, "species", image, null, dryRun);
        if (result === "updated") updated += 1;
        else if (result === "skipped") skipped += 1;
        else failed += 1;
      }
    }

    if (table === "all" || table === "manufacturer") {
      const manufacturerImages = await prisma.manufacturerImage.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: limit,
        select: {
          id: true,
          url: true,
          sourceUrl: true,
          sha256Hash: true,
          mediaAssetId: true,
          manufacturerId: true,
        },
      });

      console.log(
        `Processing ${manufacturerImages.length} manufacturer image(s)...`,
      );
      for (const image of manufacturerImages) {
        const result = await localizeRow(
          prisma,
          "manufacturer",
          image,
          image.manufacturerId,
          dryRun,
        );
        if (result === "updated") updated += 1;
        else if (result === "skipped") skipped += 1;
        else failed += 1;
      }
    }

    const remoteRemaining = await prisma.image.count({
      where: {
        deletedAt: null,
        OR: [
          { url: { startsWith: "http://" } },
          { url: { startsWith: "https://" } },
        ],
      },
    });

    console.log(
      `\nDone. updated=${updated} skipped=${skipped} failed=${failed} dryRun=${dryRun}`,
    );
    console.log(`Remote lure image URLs remaining: ${remoteRemaining}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
