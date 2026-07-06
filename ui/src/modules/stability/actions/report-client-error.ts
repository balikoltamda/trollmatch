"use server";

import { logServerError } from "@/lib/log-server-error";

export async function reportClientError(input: {
  page: string;
  message: string;
  stack?: string | null;
}): Promise<void> {
  await logServerError({
    page: input.page,
    operation: "client_boundary",
    error: Object.assign(new Error(input.message), { stack: input.stack }),
  });
}
