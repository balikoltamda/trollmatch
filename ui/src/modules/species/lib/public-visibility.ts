import type { ContentLifecycleState } from "@/generated/prisma/client";

/** Profiles anglers may browse — editorially ready or published. */
export const PUBLIC_SPECIES_PROFILE_LIFECYCLE: ContentLifecycleState[] = [
  "PUBLISHED",
  "READY",
];

export const PUBLIC_SPECIES_PROFILE_WHERE = {
  lifecycleState: { in: PUBLIC_SPECIES_PROFILE_LIFECYCLE },
} as const;
