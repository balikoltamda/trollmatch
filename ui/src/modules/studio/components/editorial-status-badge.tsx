"use client";

import { Badge } from "@/components/ui/badge";
import type { ContentLifecycleState } from "@/generated/prisma/client";
import {
  editorialStatusLabel,
} from "@/modules/studio/lib/editorial";

type EditorialStatusBadgeProps = {
  state: ContentLifecycleState;
};

export function EditorialStatusBadge({ state }: EditorialStatusBadgeProps) {
  const variant =
    state === "PUBLISHED"
      ? "ocean"
      : state === "PENDING_REVIEW"
        ? "coral"
        : state === "READY"
          ? "turquoise"
          : "muted";
  return (
    <Badge variant={variant}>
      {editorialStatusLabel(state)}
    </Badge>
  );
}
