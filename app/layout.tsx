import type { Metadata } from "next";
import "./globals.css";
import { UtilityStrip } from "@/components/UtilityStrip";
import { Nav } from "@/components/Nav";
import { SiteFooter } from "@/components/SiteFooter";
import { getEthUsd } from "@/src/web/price";
import { getNetworkStats } from "@/src/web/stats";

export const metadata: Metadata = {
  title: {
    default: "hoodscan — robinhood chain explorer",
    template: "%s — hoodscan",
  },
  description:
    "a fast, information-dense block explorer for robinhood chain (chain 4663). blocks, transactions, addresses, tokens, and token name-collision disambiguation. indexes a rolling recent window, and says so.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // the utility strip carries live eth price + gas on every page. both are
  // best-effort: a failure renders a dash, never blocks the page.
  const [ethUsd, stats] = await Promise.all([
    getEthUsd().catch(() => null),
    getNetworkStats().catch(() => null),
  ]);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <UtilityStrip ethUsd={ethUsd} gasWei={stats?.medianBaseFeeWei ?? null} />
        <Nav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
