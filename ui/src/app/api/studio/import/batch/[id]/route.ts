import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const batch = await prisma.importBatch.findUnique({
    where: { id },
    select: {
      id: true,
      manufacturerCode: true,
      displayName: true,
      status: true,
      startedAt: true,
      completedAt: true,
      durationMs: true,
      productsProcessed: true,
      createdCount: true,
      updatedCount: true,
      skippedCount: true,
      missingCount: true,
      warningCount: true,
      errorCount: true,
      reportPath: true,
    },
  });

  if (!batch) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(batch);
}
