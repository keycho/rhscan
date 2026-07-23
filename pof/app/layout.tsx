import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Proof of Flywheel — every trade turns the wheel",
  description:
    "A public flywheel layer for launch tokens. Track reserves, cycles, allocations and momentum from one terminal. Showcase demo — no backend.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans text-[13px]">{children}</body>
    </html>
  );
}
