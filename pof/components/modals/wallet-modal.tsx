"use client";

import { useState } from "react";
import { Check, Copy, Eye, History, Loader2 } from "lucide-react";
import { Modal } from "./modal";
import { usePof } from "@/lib/store";
import { DEMO_FULL_ADDRESS, DEMO_WALLET, WALLETS } from "@/data/mock-data";
import { Pill, cx } from "@/components/ui";

export function WalletModal() {
  const { closeModal, connectWallet, recentWallet, toast } = usePof();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handle = (name: string) => {
    if (connecting || connected) return;
    setConnecting(name);
    setTimeout(() => {
      setConnecting(null);
      setConnected(name);
      setTimeout(() => connectWallet(name), 600);
    }, 1200);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DEMO_FULL_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast("demo address copied — not a real wallet", "info");
    } catch {
      toast("clipboard unavailable in this browser", "info");
    }
  };

  return (
    <Modal
      title="Connect a wallet"
      subtitle="simulated connection — no wallet SDK, no signatures, no RPC"
      onClose={closeModal}
    >
      {recentWallet ? (
        <button
          onClick={() => handle(recentWallet)}
          className="mb-2 flex h-9 w-full items-center gap-2 rounded border border-accent/25 bg-accent/5 px-3 text-2xs font-mono text-secondary transition-colors hover:border-accent/50"
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
                "flex h-11 w-full items-center gap-3 rounded border px-3 text-[13px] font-medium transition-colors",
                state === "idle" &&
                  "border-line bg-panel2 text-secondary hover:border-accent/50 hover:text-text disabled:opacity-40",
                state === "connecting" && "border-accent/50 bg-panel2 text-accent",
                state === "connected" && "border-accent bg-accent/10 text-accent"
              )}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded font-mono text-2xs font-bold text-black"
                style={{ backgroundColor: w.color }}
                aria-hidden="true"
              >
                {w.initial}
              </span>
              <span className="flex-1 text-left">{w.name}</span>
              {state === "connecting" ? (
                <span className="flex items-center gap-1.5 font-mono text-2xs">
                  <Loader2 size={13} className="animate-spin" /> Connecting…
                </span>
              ) : state === "connected" ? (
                <span className="flex items-center gap-1.5 font-mono text-2xs">
                  <Check size={13} /> Wallet connected
                </span>
              ) : (
                <span className="font-mono text-3xs uppercase tracking-wider text-faint">
                  detected
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={copy}
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded border border-line px-2 font-mono text-2xs text-muted transition-colors hover:border-accent/40 hover:text-secondary"
        >
          {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
          copy demo address
        </button>
        <button
          onClick={() => {
            closeModal();
            toast("continuing in read-only mode", "info");
          }}
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded border border-line px-2 font-mono text-2xs text-muted transition-colors hover:border-accent/40 hover:text-secondary"
        >
          <Eye size={12} />
          continue read-only
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <p className="text-3xs text-faint">no real private key exists. display address only.</p>
        <Pill tone="amber">simulated</Pill>
      </div>
    </Modal>
  );
}
