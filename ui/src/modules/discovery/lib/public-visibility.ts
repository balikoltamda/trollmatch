import type { ContentLifecycleState, Prisma } from "@/generated/prisma/client";

/** Lures anglers may browse — editorially ready or published. */
export const PUBLIC_LURE_LIFECYCLE: ContentLifecycleState[] = [
  "PUBLISHED",
  "READY",
];

export const PUBLIC_LURE_WHERE: Prisma.LureModelWhereInput = {
  deletedAt: null,
  lifecycleState: { in: PUBLIC_LURE_LIFECYCLE },
};

export function isPubliclyVisibleLifecycle(
  state: ContentLifecycleState,
): boolean {
  return PUBLIC_LURE_LIFECYCLE.includes(state);
}
