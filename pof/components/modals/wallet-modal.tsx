"use client";

import { useState } from "react";
import { Check, Eye, History, Loader2 } from "lucide-react";
import { Modal } from "./modal";
import { usePof } from "@/lib/store";
import { DEMO_WALLET, WALLETS } from "@/data/mock-data";
import { cx } from "@/components/ui";

export function WalletModal() {
  const { closeModal, connectWallet, recentWallet, toast } = usePof();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<string | null>(null);

  const handle = (name: string) => {
    if (connecting || connected) return;
    setConnecting(name);
    setTimeout(() => {
      setConnecting(null);
      setConnected(name);
      setTimeout(() => connectWallet(name), 600);
    }, 1200);
  };

  return (
    <Modal title="connect a wallet" subtitle="select a wallet to continue" onClose={closeModal}>
      {recentWallet ? (
        <button
          onClick={() => handle(recentWallet)}
          className="mb-2 flex h-9 w-full items-center gap-2 rounded border border-accent/40 bg-accent/5 px-3 text-2xs text-secondary transition hover:border-accent"
        >
          <History size={13} className="text-accent" />
          recent · {recentWallet} · {DEMO_WALLET.address}
        </button>
      ) : null}

      <div className="space-y-2">
        {WALLETS.map((w) => {
          const state =
            connected === w.name ? "connected" : connecting === w.name ? "connecting" : "idle";
          return (
            <button
              key={w.name}
              onClick={() => handle(w.name)}
              disabled={connecting !== null || connected !== null}
              className={cx(
                "flex h-11 w-full items-center gap-3 rounded border px-3 text-xs font-medium transition active:translate-y-px",
                state === "idle" &&
                  "border-line bg-panel2 text-secondary hover:border-accent/60 hover:text-text disabled:opacity-40",
                state === "connecting" && "border-accent/60 bg-panel2 text-accent",
                state === "connected" && "border-accent bg-accent/10 text-accent"
              )}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded text-2xs font-bold text-black"
                style={{ backgroundColor: w.color }}
                aria-hidden="true"
              >
                {w.initial}
              </span>
              <span className="flex-1 text-left">{w.name}</span>
              {state === "connecting" ? (
                <span className="flex items-center gap-1.5 text-2xs">
                  <Loader2 size={13} className="animate-spin" /> Connecting…
                </span>
              ) : state === "connected" ? (
                <span className="flex items-center gap-1.5 text-2xs">
                  <Check size={13} /> Wallet connected
                </span>
              ) : (
                <span className="text-3xs uppercase tracking-wider text-faint">detected</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => {
          closeModal();
          toast("continuing in read-only mode", "info");
        }}
        className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded border border-line px-2 text-2xs text-muted transition hover:border-accent/60 hover:text-secondary"
      >
        <Eye size={12} />
        continue in read-only mode
      </button>
    </Modal>
  );
}
