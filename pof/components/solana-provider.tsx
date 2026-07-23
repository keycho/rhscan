"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta";

// real wallet layer: standard wallets (phantom, solflare, backpack, …)
// register themselves via the wallet-standard, so no per-wallet adapters are
// bundled. only genuinely installed wallets will report as installed.
export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(
    () =>
      process.env.NEXT_PUBLIC_RPC_URL ??
      clusterApiUrl(SOLANA_NETWORK as Parameters<typeof clusterApiUrl>[0]),
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function shortAddress(addr: string): string {
  return addr.length > 10 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;
}
