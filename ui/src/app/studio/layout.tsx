import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StudioLayoutFrame } from "@/modules/studio/components/studio-layout-frame";
import "../globals.css";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Balık Oltamda Studio",
    template: "%s · Studio",
  },
  description: "TrollMatch internal catalog and editorial workspace.",
  robots: { index: false, follow: false },
};

export default function StudioRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      >
        <StudioLayoutFrame>{children}</StudioLayoutFrame>
      </body>
    </html>
  );
}
