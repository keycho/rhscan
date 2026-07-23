"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { Modal } from "./modal";
import { usePof } from "@/lib/store";
import { shortAddress } from "@/components/solana-provider";
import { cx } from "@/components/ui";

// wallets we surface an install link for when they are not detected in the
// browser. only genuinely installed wallets are shown as connectable.
const KNOWN_WALLETS = [
  { name: "Phantom", url: "https://phantom.com/download" },
  { name: "Solflare", url: "https://www.solflare.com/download/" },
  { name: "Backpack", url: "https://backpack.app/download" },
];

export function WalletModal() {
  const { closeModal, toast } = usePof();
  const { wallets, select, connect, connecting, connected, publicKey, wallet } = useWallet();
  const [chosen, setChosen] = useState<WalletName | null>(null);
  const [error, setError] = useState<string | null>(null);

  const installed = useMemo(
    () =>
      wallets.filter(
        (w) =>
          w.readyState === WalletReadyState.Installed ||
          w.readyState === WalletReadyState.Loadable
      ),
    [wallets]
  );

  const missing = KNOWN_WALLETS.filter(
    (k) => !installed.some((w) => w.adapter.name.toLowerCase().includes(k.name.toLowerCase()))
  );

  // once a wallet is selected, attempt the real connection
  useEffect(() => {
    if (!chosen || !wallet || wallet.adapter.name !== chosen || connected || connecting) return;
    connect().catch((e: unknown) => {
      setChosen(null);
      setError(e instanceof Error ? e.message : "connection failed");
    });
  }, [chosen, wallet, connected, connecting, connect]);

  // close on successful connection
  useEffect(() => {
    if (connected && publicKey) {
      toast(`wallet connected — ${shortAddress(publicKey.toBase58())}`);
      closeModal();
    }
  }, [connected, publicKey, toast, closeModal]);

  return (
    <Modal
      title="connect creator wallet"
      subtitle="pof never requests seed phrases or private keys"
      onClose={closeModal}
    >
      {installed.length === 0 ? (
        <p className="rounded border border-line bg-panel2 px-3 py-2.5 text-2xs leading-4 text-secondary">
          no Solana wallet detected in this browser. install one of the wallets below, then
          reload this page.
        </p>
      ) : null}

      <div className="mt-2 space-y-2">
        {installed.map((w) => {
          const isConnecting = connecting && wallet?.adapter.name === w.adapter.name;
          return (
            <button
              key={w.adapter.name}
              onClick={() => {
                setError(null);
                setChosen(w.adapter.name);
                select(w.adapter.name);
              }}
              disabled={connecting}
              className={cx(
                "flex h-11 w-full items-center gap-3 rounded border px-3 text-xs font-medium transition active:translate-y-px",
                isConnecting
                  ? "border-accent/60 bg-panel2 text-accent"
                  : "border-line bg-panel2 text-secondary hover:border-accent/60 hover:text-text disabled:opacity-40"
              )}
            >
              {/* real wallet icon from the adapter */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.adapter.icon} alt="" className="h-6 w-6 rounded" />
              <span className="flex-1 text-left">{w.adapter.name}</span>
              {isConnecting ? (
                <span className="flex items-center gap-1.5 text-2xs">
                  <Loader2 size={13} className="animate-spin" /> connecting…
                </span>
              ) : (
                <span className="text-3xs uppercase tracking-wider text-accent">installed</span>
              )}
            </button>
          );
        })}

        {missing.map((k) => (
          <a
            key={k.name}
            href={k.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-full items-center gap-3 rounded border border-line bg-panel2 px-3 text-xs font-medium text-muted transition hover:border-line-strong hover:text-secondary"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded border border-line text-2xs font-bold">
              {k.name[0]}
            </span>
            <span className="flex-1 text-left">{k.name}</span>
            <span className="flex items-center gap-1 text-3xs uppercase tracking-wider">
              install <ArrowUpRight size={11} />
            </span>
          </a>
        ))}
      </div>

      {error ? <p className="mt-3 text-2xs text-negative">{error}</p> : null}

      <p className="mt-4 border-t border-line pt-3 text-3xs leading-4 text-faint">
        connecting shares only your public address. the public dashboard is readable without a
        wallet — a wallet is needed to activate or manage a flywheel when the protocol goes live.
      </p>
    </Modal>
  );
}
