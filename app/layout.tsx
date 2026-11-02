import type { Metadata, Viewport } from "next";
import { Big_Shoulders, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import "./globals.css";

const display = Big_Shoulders({ subsets: ["latin"], variable: "--font-display", adjustFontFallback: false });
const body = Public_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Chunderdome II",
  description: "Dillon Beach · Nov 13–15, 2026. Rides, gear, food, and glory.",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "Chunderdome", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#14161b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
