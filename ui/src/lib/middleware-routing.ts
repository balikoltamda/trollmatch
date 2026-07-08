/**
 * Route classification for Next.js middleware.
 * API routes, static assets, and Next internals must never receive locale redirects.
 */

export const LOCALE_EXCLUDED_EXACT = [
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
] as const;

/** Pathnames that run middleware but must skip next-intl (handled earlier in chain). */
export const LOCALE_EXCLUDED_PREFIXES = ["/api/", "/_next/"] as const;

/**
 * Whether next-intl locale detection / prefix redirects should run.
 * Studio and auth branches are handled before this check in middleware.ts.
 */
export function shouldApplyLocaleMiddleware(pathname: string): boolean {
  if (
    LOCALE_EXCLUDED_EXACT.includes(
      pathname as (typeof LOCALE_EXCLUDED_EXACT)[number],
    )
  ) {
    return false;
  }

  if (LOCALE_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }

  // Static files: /file.ext or /path/to/file.ext
  if (/\.[^/]+$/.test(pathname)) {
    return false;
  }

  return true;
}

/**
 * Mirrors `config.matcher` — used by tests to assert production routing boundaries.
 */
export function isMiddlewareMatched(pathname: string): boolean {
  if (pathname.startsWith("/api/studio")) {
    return true;
  }

  const rest = pathname.slice(1);
  if (rest === "") {
    return true;
  }
  if (rest.startsWith("api/")) {
    return false;
  }
  if (rest.startsWith("_next/")) {
    return false;
  }
  if (rest === "favicon.ico" || rest === "robots.txt" || rest === "sitemap.xml") {
    return false;
  }
  if (/\.[^/]+$/.test(pathname)) {
    return false;
  }

  return true;
}

export const middlewareMatchers = [
  "/api/studio/:path*",
  "/((?!api|_next|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
] as const;
