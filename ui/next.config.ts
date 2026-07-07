import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { MANUFACTURER_IMAGE_HOSTS } from "./src/modules/import/images/manufacturer-image-hosts";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Local media + manufacturer CDNs for draft/remote display in Studio and public preview. */
function buildImageRemotePatterns() {
  const hostnames = new Set<string>(["localhost", ...MANUFACTURER_IMAGE_HOSTS]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      hostnames.add(new URL(siteUrl).hostname);
    } catch {
      // ignore invalid env
    }
  }

  return [...hostnames].flatMap((hostname) => [
    { protocol: "https" as const, hostname, pathname: "/**" },
    { protocol: "http" as const, hostname, pathname: "/**" },
  ]);
}

/** Next.js 15+ rejects unlisted local src paths with HTTP 400 from /_next/image. */
function buildImageLocalPatterns() {
  return [
    { pathname: "/media/**" },
    { pathname: "/lures/**" },
  ];
}

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "sharp",
  ],
  images: {
    localPatterns: buildImageLocalPatterns(),
    remotePatterns: buildImageRemotePatterns(),
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
  },
};

export default withNextIntl(nextConfig);
