import { prisma } from "@/lib/prisma";

export type ServerErrorInput = {
  page: string;
  slug?: string | null;
  operation?: string | null;
  error: unknown;
};

function normalizeError(error: unknown): { message: string; stack: string | null } {
  if (error instanceof Error) {
    return {
      message: error.message.slice(0, 1024),
      stack: error.stack?.slice(0, 8000) ?? null,
    };
  }
  return {
    message: String(error).slice(0, 1024),
    stack: null,
  };
}

/**
 * Log every server exception — stderr + DB (best-effort).
 * Never throws.
 */
export async function logServerError(input: ServerErrorInput): Promise<void> {
  const { message, stack } = normalizeError(input.error);

  console.error(
    JSON.stringify({
      level: "error",
      page: input.page,
      slug: input.slug ?? null,
      operation: input.operation ?? null,
      message,
      at: new Date().toISOString(),
    }),
  );

  try {
    await prisma.runtimeErrorLog.create({
      data: {
        page: input.page.slice(0, 512),
        slug: input.slug?.slice(0, 256) ?? null,
        operation: input.operation?.slice(0, 128) ?? null,
        message,
        stack,
      },
    });
  } catch {
    // DB unavailable — stderr log above is the fallback
  }
}
