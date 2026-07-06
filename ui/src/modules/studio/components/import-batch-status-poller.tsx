"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ACTIVE_STATUSES = new Set(["QUEUED", "RUNNING"]);

/** Refreshes server-rendered import UI every 2s while any batch is queued or running. */
export function ImportBatchStatusPoller({
  statuses,
}: {
  statuses: string[];
}) {
  const router = useRouter();
  const hasActive = statuses.some((status) => ACTIVE_STATUSES.has(status));

  useEffect(() => {
    if (!hasActive) {
      return;
    }

    const interval = setInterval(() => {
      router.refresh();
    }, 2000);

    return () => clearInterval(interval);
  }, [hasActive, router]);

  return null;
}
