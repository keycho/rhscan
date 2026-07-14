import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { IndexedRangeNote } from "@/components/Disclosures";
import { loadWatermarks } from "@/src/web/cache";

export const metadata: Metadata = {
  title: {
    default: "rhscan — robinhood chain explorer",
    template: "%s — rhscan",
  },
  description:
    "a fast, information-dense block explorer for robinhood chain (chain 4663). blocks, transactions, addresses, tokens, and token name-collision disambiguation.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const wm = await loadWatermarks();
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-page px-4 py-5">{children}</main>
        <footer className="mx-auto mt-10 max-w-page border-t border-border px-4 py-6">
          <IndexedRangeNote
            head={wm.head}
            backfillFloor={wm.backfillFloor}
            windowFloor={wm.windowFloor}
          />
          <p className="mt-2 text-2xs text-faint">
            rhscan indexes a rolling recent window and resolves older data live on
            demand. figures below the window are served from the chain and cached.
          </p>
        </footer>
      </body>
    </html>
  );
}
