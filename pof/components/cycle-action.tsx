"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { usePof } from "@/lib/store";
import { fmt } from "@/lib/format";
import { Card, LiveDot, btn, cx } from "@/components/ui";

// the corrected product flow: creators claim rewards on pump.fun themselves,
// deposit them here, and only then does the protocol execute the routing
// cycle. nothing is pulled or claimed automatically by pof.
export function CycleAction() {
  const { wallet, cycles, feesRouted, gate, toast, depositAndExecute } = usePof();
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const lastComplete = cycles.find((c) => c.status === "Complete");
  const available = wallet?.claimedRewards ?? 0;
  const idle = !wallet || available <= 0;

  const submit = () =>
    gate("wallet", () => {
      if (!confirmed) {
        toast("confirm creator wallet authorisation first", "info");
        return;
      }
      const value = parseFloat(amount);
      if (!(value > 0)) {
        toast("enter a deposit amount in SOL", "info");
        return;
      }
      if (value > available) {
        toast(`amount exceeds claimed balance (${fmt(available, 2)} SOL)`, "info");
        return;
      }
      if (depositAndExecute(value)) {
        setAmount("");
      }
    });

  return (
    <section id="deposit" className="mx-auto max-w-page scroll-mt-20 px-4 pb-12">
      <Card className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-sm font-bold lowercase text-accent">route claimed rewards</p>
          {idle ? (
            <span className="rounded-full border border-amber/40 px-2.5 py-0.5 text-3xs lowercase text-amber">
              awaiting creator deposit
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-accent/40 px-2.5 py-0.5 text-3xs lowercase text-accent">
              <LiveDot /> deposit ready
            </span>
          )}
        </div>

        <p className="border-b border-line bg-panel2/60 px-4 py-2 text-center text-3xs text-secondary">
          claim on pump.fun <span className="text-accent">→</span> deposit rewards{" "}
          <span className="text-accent">→</span> execute routing cycle{" "}
          <span className="text-accent">→</span> liquidity / burns / holders / treasury
        </p>

        <div className="grid grid-cols-3 gap-px bg-line">
          <div className="bg-panel px-3 py-2.5 text-center">
            <p className="text-xs font-bold tabular-nums text-text">
              {wallet ? `${fmt(available, 2)} SOL` : "—"}
            </p>
            <p className="mt-0.5 text-3xs text-muted">available claimed balance</p>
          </div>
          <div className="bg-panel px-3 py-2.5 text-center">
            <p className="text-xs font-bold tabular-nums text-text">
              {lastComplete ? `#${lastComplete.epoch} · ${fmt(lastComplete.feesIn, 2)} SOL` : "—"}
            </p>
            <p className="mt-0.5 text-3xs text-muted">last completed cycle</p>
          </div>
          <div className="bg-panel px-3 py-2.5 text-center">
            <p className="text-xs font-bold tabular-nums text-text">{fmt(feesRouted, 2)} SOL</p>
            <p className="mt-0.5 text-3xs text-muted">total claimed rewards routed</p>
          </div>
        </div>

        <div className="border-t border-line px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://pump.fun"
              target="_blank"
              rel="noopener noreferrer"
              className={btn.outline}
            >
              claim on pump.fun <ArrowUpRight size={13} />
            </a>
            <div className="flex min-w-0 flex-1 items-center">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="deposit amount"
                inputMode="decimal"
                className="h-9 w-full min-w-24 rounded-l border border-r-0 border-line bg-bg px-3 text-xs text-text placeholder:text-faint outline-none transition focus:border-accent"
              />
              <span className="flex h-9 items-center rounded-r border border-line bg-panel2 px-2.5 text-2xs text-muted">
                SOL
              </span>
            </div>
            <button onClick={submit} className={btn.solid}>
              deposit &amp; execute cycle
            </button>
          </div>

          <button
            onClick={() => setConfirmed((v) => !v)}
            className="mt-3 flex w-full items-start gap-2 text-left"
          >
            <span
              className={cx(
                "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition",
                confirmed ? "border-accent bg-accent text-accent-ink" : "border-line-strong"
              )}
              aria-checked={confirmed}
              role="checkbox"
            >
              {confirmed ? <Check size={11} /> : null}
            </span>
            <span className="text-3xs leading-4 text-muted">
              I confirm that I control or am authorised to use this token&apos;s creator wallet,
              and I accept the{" "}
              <Link href="/terms" className="text-secondary underline underline-offset-2 hover:text-accent">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/risks" className="text-secondary underline underline-offset-2 hover:text-accent">
                Risk Disclosure
              </Link>
              .
            </span>
          </button>

          <p className="mt-2.5 text-3xs leading-4 text-faint">
            pof never claims creator rewards for you — claim on pump.fun first, then deposit here
            to execute the routing cycle. token performance, liquidity and returns are never
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
