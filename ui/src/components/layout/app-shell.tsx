import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type AppShellProps = {
  children: ReactNode;
  skipLabel: string;
};

export function AppShell({ children, skipLabel }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="focus-visible:ring-ring focus:bg-background sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:px-3 focus:py-2 focus:ring-2"
      >
        {skipLabel}
      </a>
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
