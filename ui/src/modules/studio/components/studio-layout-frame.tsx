"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StudioSidebar } from "@/modules/studio/components/studio-sidebar";

export function StudioLayoutFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <StudioSidebar currentPath={pathname} />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
