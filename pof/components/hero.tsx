"use client";

import { ArrowRight, Rocket } from "lucide-react";
import { usePof } from "@/lib/store";
import { GENESIS, MOMENTUM_SPARK } from "@/data/mock-data";
import { fmt, fmtCountdown } from "@/lib/format";
import { Sparkline } from "@/components/sparkline";
import { LiveDot, Panel, btn } from "@/components/ui";

export function Hero() {
  const { speed, epoch, nextCycle, feesRouted, gate } = usePof();

  return (
    <section id="dashboard" className="relative border-b border-line">
      <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-page items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_400px] lg:py-14">
        {/* left — copy */}
        <div>
          <p className="mb-3 font-mono text-2xs uppercase tracking-[0.2em] text-accent">
            // a public flywheel layer for launch tokens
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl">
            Proof of Flywheel
          </h1>
          <p className="mt-2 font-mono text-lg text-accent">every trade turns the wheel</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-secondary">
            Launch a public flywheel engine for your token. Track reserves, cycles, allocations
            and momentum from one terminal. Fees in. Reserves build. Momentum compounds.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="#engine" className={btn.primary}>
              View Genesis Engine <ArrowRight size={14} />
            </a>
            <button
              onClick={() =>
                gate("wallet", () =>
                  document.querySelector("#launch")?.scrollIntoView({ behavior: "smooth" })
                )
              }
              className={btn.outline}
            >
              <Rocket size={13} /> Launch Your Flywheel
            </button>
          </div>
          <p className="mt-5 font-mono text-2xs text-muted">
            <span className="text-accent">1</span> engine live ·{" "}
            <span className="text-accent">9</span> open slots ·{" "}
            <span className="text-accent">{fmt(GENESIS.totalCycles)}</span> cycles settled ·
            be the next token on the board
          </p>
        </div>

        {/* right — live summary card */}
        <Panel className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line bg-panel2 px-3 py-2">
            <span className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-negative/70" />
              <span className="h-2 w-2 rounded-full bg-amber/70" />
              <span className="h-2 w-2 rounded-full bg-accent/70" />
            </span>
            <span className="font-mono text-3xs uppercase tracking-[0.14em] text-muted">
              engine_001 — genesis wheel
            </span>
            <span className="ml-auto flex items-center gap-1.5 font-mono text-3xs uppercase tracking-wider text-accent">
              <LiveDot /> live
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-3xs uppercase tracking-[0.14em] text-muted">
                  flywheel speed
                </p>
                <p className="font-mono text-3xl font-bold text-accent">{fmt(speed, 0)}%</p>
              </div>
              <Sparkline data={MOMENTUM_SPARK} width={130} height={36} />
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-panel2">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700"
                style={{ width: `${speed}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line">
              {[
                { label: "fees routed", value: `${fmt(feesRouted, 1)} SOL` },
                { label: "total routed", value: GENESIS.totalRoutedValue },
                { label: "total cycles", value: fmt(GENESIS.totalCycles) },
                { label: "momentum", value: `${GENESIS.momentumScore} / 100` },
              ].map((m) => (
                <div key={m.label} className="bg-panel px-3 py-2">
                  <p className="font-mono text-3xs uppercase tracking-wider text-muted">{m.label}</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-text">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between font-mono text-2xs">
              <span className="text-muted">
                epoch <span className="text-text">#{epoch}</span>
              </span>
              <span className="text-muted">
                next cycle <span className="text-accent">{fmtCountdown(nextCycle)}</span>
              </span>
              <span className="flex items-center gap-1.5 text-secondary">
                <LiveDot /> turning
              </span>
            </div>
          </div>
        </Panel>
      </div>
    </section>
  );
}
