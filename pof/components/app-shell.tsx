"use client";

import { PofProvider, usePof } from "@/lib/store";
import { SolanaProvider } from "@/components/solana-provider";
import { TopNav } from "@/components/top-nav";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/toaster";
import { WalletModal } from "@/components/modals/wallet-modal";
import { ActivationModal } from "@/components/modals/activation-modal";

function Modals() {
  const { modal } = usePof();
  if (modal === "wallet") return <WalletModal />;
  if (modal === "activate") return <ActivationModal />;
  return null;
}

/** shared page chrome: providers, nav, footer, modals, toasts */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SolanaProvider>
      <PofProvider>
        <TopNav />
        {children}
        <SiteFooter />
        <Modals />
        <Toaster />
      </PofProvider>
    </SolanaProvider>
  );
}
