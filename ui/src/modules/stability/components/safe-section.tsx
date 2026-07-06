import type { ReactNode } from "react";
import { logServerError } from "@/lib/log-server-error";

type SafeSectionProps = {
  page: string;
  section: string;
  slug?: string;
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Renders children; on failure logs and returns fallback (null = hide section).
 */
export async function SafeSection({
  page,
  section,
  slug,
  fallback = null,
  children,
}: SafeSectionProps) {
  try {
    return children;
  } catch (error) {
    await logServerError({ page, slug, operation: section, error });
    return fallback;
  }
}
