"use client";

import { NotificationCenter } from "@/modules/notification-center/components/notification-center";

export function StudioTopBar() {
  return (
    <header className="border-border/70 bg-background/90 sticky top-0 z-20 flex h-12 shrink-0 items-center justify-end border-b px-4 backdrop-blur-sm">
      <NotificationCenter />
    </header>
  );
}
