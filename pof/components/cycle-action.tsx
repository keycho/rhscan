"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePof } from "@/lib/store";
import { useSolBalance } from "@/lib/use-sol-balance";
import { fmt } from "@/lib/format";
import { Card, LiveDot, btn, cx } from "@/components/ui";

// funding panel. the genesis numbers are protocol simulation; the wallet
// balance is real when a wallet is connected. deposits are disabled because
// the protocol contracts are not live — nothing here fakes a transaction.
export function CycleAction() {
  const { cycles, feesRouted, flywheelBalance } = usePof();
  const { connected } = useWallet();
  const balance = useSolBalance();

  const lastComplete = cycles.find((c) => c.status === "Complete");

  return (
    <section id="deposit" className="mx-auto max-w-page scroll-mt-20 px-4 pb-12">
      <Card className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-sm font-bold lowercase text-accent">fund the flywheel</p>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-amber/40 px-2 py-0.5 text-3xs lowercase text-amber">
              protocol simulation
            </span>
            {flywheelBalance > 0 ? (
              <span className="flex items-center gap-1.5 rounded-full border border-accent/40 px-2.5 py-0.5 text-3xs lowercase text-accent">
                <LiveDot /> ready to execute
              </span>
            ) : (
              <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-3xs lowercase text-secondary">
                awaiting deposit
              </span>
            )}
          </div>
        </div>

        <p className="border-b border-line bg-panel2/60 px-4 py-2 text-center text-3xs text-secondary">
          connect creator wallet <span className="text-accent">→</span> verify token{" "}
          <span className="text-accent">→</span> configure routing{" "}
          <span className="text-accent">→</span> deposit SOL{" "}
          <span className="text-accent">→</span> execute cycle
        </p>

        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          <div className="bg-panel px-3 py-2.5 text-center">
            <p className="text-xs font-bold tabular-nums text-text">
              {fmt(flywheelBalance, 2)} SOL
            </p>
            <p className="mt-0.5 text-3xs text-muted">flywheel balance · sim</p>
          </div>
          <div className="bg-panel px-3 py-2.5 text-center">
            <p className="text-xs font-bold tabular-nums text-text">
              {connected && balance !== null ? `${fmt(balance, 2)} SOL` : "—"}
            </p>
            <p className="mt-0.5 text-3xs text-muted">available wallet balance</p>
          </div>
          <div className="bg-panel px-3 py-2.5 text-center">
            <p className="text-xs font-bold tabular-nums text-text">
              {lastComplete ? `#${lastComplete.epoch} · ${fmt(lastComplete.feesIn, 2)} SOL` : "—"}
            </p>
            <p className="mt-0.5 text-3xs text-muted">last completed cycle · sim</p>
          </div>
          <div className="bg-panel px-3 py-2.5 text-center">
            <p className="text-xs font-bold tabular-nums text-text">{fmt(feesRouted, 2)} SOL</p>
            <p className="mt-0.5 text-3xs text-muted">total SOL routed · sim</p>
          </div>
        </div>

        <div className="border-t border-line px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center opacity-50">
              <input
                disabled
                placeholder="deposit amount"
                className="h-9 w-full min-w-24 rounded-l border border-r-0 border-line bg-bg px-3 text-xs text-text placeholder:text-faint outline-none"
              />
              <span className="flex h-9 items-center rounded-r border border-line bg-panel2 px-2.5 text-2xs text-muted">
                SOL
              </span>
            </div>
            <button disabled className={cx(btn.outline, "opacity-50")}>
              deposit SOL
            </button>
            <button disabled className={cx(btn.solid, "opacity-60")}>
              <Lock size={12} /> deposit &amp; execute cycle
            </button>
          </div>

          <div className="mt-3 rounded border border-amber/40 bg-panel2 px-3 py-2.5 text-2xs leading-5 text-secondary">
            deposits open when the protocol contracts go live. connecting a wallet today shares
            only your public address — no transaction is created, signed or executed on this site.
          </div>

          <p className="mt-2.5 text-3xs leading-4 text-faint">
            any SOL deposited into a flywheel is routed according to the active configuration.
            only the verified creator wallet can fund or reconfigure a flywheel. returns are never
            guaranteed ·{" "}
            <Link href="/risks" className="underline underline-offset-2 hover:text-secondary">
              risk disclosure
            </Link>
          </p>
        </div>
      </Card>
    </section>
  );
}
