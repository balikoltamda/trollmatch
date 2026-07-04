import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/ui/container";

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
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function AppMain({ children }: { children: ReactNode }) {
  return (
    <Container size="wide" className="py-8 sm:py-10 lg:py-12">
      {children}
    </Container>
  );
}
