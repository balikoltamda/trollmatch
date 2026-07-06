"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { reportClientError } from "@/modules/stability/actions/report-client-error";

type PageErrorViewProps = {
  title: string;
  description: string;
  homeLabel: string;
  retryLabel: string;
  reset: () => void;
  error?: Error & { digest?: string };
};

export function PageErrorView({
  title,
  description,
  homeLabel,
  retryLabel,
  reset,
  error,
}: PageErrorViewProps) {
  useEffect(() => {
    void reportClientError({
      page: typeof window !== "undefined" ? window.location.pathname : "unknown",
      message: error?.message ?? title,
      stack: error?.stack ?? null,
    });
  }, [error, title]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="border-border bg-surface-muted/40 max-w-lg rounded-xl border px-6 py-12 text-center">
        <h1 className="text-foreground text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {description}
        </p>
        <nav className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/" className="text-ocean font-medium hover:underline">
            {homeLabel}
          </Link>
          <button
            type="button"
            className="text-ocean font-medium hover:underline"
            onClick={reset}
          >
            {retryLabel}
          </button>
        </nav>
      </div>
    </div>
  );
}
