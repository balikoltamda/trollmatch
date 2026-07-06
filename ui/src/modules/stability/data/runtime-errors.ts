import { prisma } from "@/lib/prisma";

export type RuntimeErrorRow = {
  id: string;
  page: string;
  slug: string | null;
  operation: string | null;
  message: string;
  stack: string | null;
  resolved: boolean;
  createdAt: Date;
};

export async function listRuntimeErrors(limit = 100): Promise<RuntimeErrorRow[]> {
  try {
    return await prisma.runtimeErrorLog.findMany({
      orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        page: true,
        slug: true,
        operation: true,
        message: true,
        stack: true,
        resolved: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

export async function countUnresolvedErrors(): Promise<number> {
  try {
    return await prisma.runtimeErrorLog.count({ where: { resolved: false } });
  } catch {
    return 0;
  }
}
