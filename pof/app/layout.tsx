import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "proof of flywheel — every trade turns the wheel",
  description:
    "launch the loop. route the fees. keep it turning. a public flywheel layer for launch tokens.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetbrains.variable}>
      <body className="font-mono text-[13px]">{children}</body>
    </html>
  );
}
