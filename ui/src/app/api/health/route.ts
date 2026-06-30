import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        service: "balik-oltamda-guide-ui",
        database: "connected",
        timestamp,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        service: "balik-oltamda-guide-ui",
        database: "disconnected",
        timestamp,
      },
      { status: 503 },
    );
  }
}
