"use client";

import { useState } from "react";
import Link from "next/link";
import { usePof } from "@/lib/store";
import { useSolBalance } from "@/lib/use-sol-balance";
import { useWallet } from "@solana/wallet-adapter-react";
import { fmt } from "@/lib/format";
import { Card, LiveDot, btn, cx } from "@/components/ui";

// genesis engine funding console. deposits here feed the demo engine's
// balance and cycles — they never touch the connected wallet, and no
// transaction is created or submitted.
export function CycleAction() {
  const { cycles, feesRouted, flywheelBalance, simDeposit, simExecuteCycle, toast } = usePof();
  const { connected } = useWallet();
  const balance = useSolBalance();
  const [amount, setAmount] = useState("");

  const lastComplete = cycles.find((c) => c.status === "Complete");

  const parse = (): number | null => {
    const value = parseFloat(amount);
    if (!(value > 0)) {
      toast("enter a deposit amount in SOL", "info");
      return null;
    }
    if (value > 1000) {
      toast("keep planned deposits under 1,000 SOL", "info");
      return null;
    }
    return value;
  };

  return (
    <section id="deposit" className="mx-auto max-w-page scroll-mt-20 px-4 pb-12">
      <Card className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-sm font-bold lowercase text-accent">fund the flywheel</p>
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
            <p className="mt-0.5 text-3xs text-muted">flywheel balance</p>
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
            <p className="mt-0.5 text-3xs text-muted">last completed cycle</p>
          </div>
          <div className="bg-panel px-3 py-2.5 text-center">
            <p className="text-xs font-bold tabular-nums text-text">{fmt(feesRouted, 2)} SOL</p>
            <p className="mt-0.5 text-3xs text-muted">total SOL routed</p>
          </div>
        </div>

        <div className="border-t border-line px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="planned deposit"
                inputMode="decimal"
                className="h-9 w-full min-w-24 rounded-l border border-r-0 border-line bg-bg px-3 text-xs text-text placeholder:text-faint outline-none transition focus:border-accent"
              />
              <span className="flex h-9 items-center rounded-r border border-line bg-panel2 px-2.5 text-2xs text-muted">
                SOL
              </span>
            </div>
            <button
              onClick={() => {
                const v = parse();
                if (v === null) return;
                simDeposit(v);
                setAmount("");
              }}
              className={btn.outline}
            >
              deposit SOL
            </button>
            <button
              onClick={() => {
                const v = parse();
                if (v === null) return;
                simExecuteCycle(v);
                setAmount("");
              }}
              className={cx(btn.solid)}
            >
              deposit &amp; execute cycle
            </button>
          </div>

          <p className="mt-2.5 text-3xs leading-4 text-faint">
            deposits feed the genesis engine preview — your wallet is never charged and no
            transaction is submitted. any SOL deposited into a live flywheel is routed according
            to the active configuration. returns are never guaranteed ·{" "}
            <Link href="/risks" className="underline underline-offset-2 hover:text-secondary">
              risk disclosure
            </Link>
          </p>
        </div>
      </Card>
    </section>
  );
}
