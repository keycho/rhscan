import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

// canonical production domain comes from NEXT_PUBLIC_SITE_URL; VERCEL_URL is
// only a development/preview fallback.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const DESCRIPTION = "Fund the wheel. Route the SOL. Strengthen the token.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Proof of Flywheel",
  description: DESCRIPTION,
  openGraph: {
    title: "Proof of Flywheel",
    description: DESCRIPTION,
    images: [
      {
        url: "/og-v2.png",
        width: 1200,
        height: 630,
        alt: "Proof of Flywheel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Proof of Flywheel",
    description: DESCRIPTION,
    images: ["/og-v2.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetbrains.variable}>
      <body className="font-mono text-[13px]">{children}</body>
    </html>
  );
}
