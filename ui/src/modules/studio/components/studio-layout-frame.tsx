"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StudioSidebar } from "@/modules/studio/components/studio-sidebar";
import { StudioTopBar } from "@/modules/studio/components/studio-top-bar";

export function StudioLayoutFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/studio/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <StudioSidebar currentPath={pathname} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <StudioTopBar />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
