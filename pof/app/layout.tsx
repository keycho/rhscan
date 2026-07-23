import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

// absolute base for og/twitter images: custom domain via NEXT_PUBLIC_SITE_URL,
// else the vercel deployment url, else localhost in dev
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Proof of Flywheel",
  description: "Turn claimed creator rewards into token momentum.",
  openGraph: {
    title: "Proof of Flywheel",
    description: "Turn claimed creator rewards into token momentum.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Proof of Flywheel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Proof of Flywheel",
    description: "Turn claimed creator rewards into token momentum.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetbrains.variable}>
      <body className="font-mono text-[13px]">{children}</body>
    </html>
  );
}
