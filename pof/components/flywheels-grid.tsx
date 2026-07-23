"use client";

import { Plus } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePof } from "@/lib/store";
import { ALLOCATION_MODES, GENESIS } from "@/data/mock-data";
import { fmt, fmtAgo } from "@/lib/format";
import { Card, LiveDot, PofMark, SectionHead, btn } from "@/components/ui";

export function FlywheelsGrid() {
  const {
    totalCycles,
    feesRouted,
    flywheelBalance,
    cycles,
    tick,
    openModal,
    searchQuery,
  } = usePof();
  const { connected } = useWallet();

  const q = searchQuery.trim().toLowerCase();
  const lastCycle = cycles[0];
  const genesisAlloc = ALLOCATION_MODES.Momentum;
  const genesisMatches = !q || `genesis wheel $pof ${GENESIS.mint}`.toLowerCase().includes(q);

  return (
    <section id="flywheels" className="mx-auto max-w-page scroll-mt-20 px-4 pb-12">
      <SectionHead
        title="live flywheels"
        right={
          <span className="rounded-full border border-amber/40 px-2 py-0.5 text-3xs lowercase text-amber">
            protocol simulation
          </span>
        }
      />
      <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
        {genesisMatches ? (
          <Card className="flex flex-col px-4 py-3.5 transition hover:border-line-strong">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded border border-accent/50 bg-panel2 text-accent">
                <PofMark size={20} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-text">Genesis Wheel</p>
                <p className="text-2xs text-accent">
                  {GENESIS.ticker} <span className="text-faint">· {GENESIS.mint}</span>
                </p>
              </div>
              <span className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border border-accent/40 px-2 py-0.5 text-3xs lowercase text-accent">
                <LiveDot /> active
              </span>
            </div>
            <p className="mt-2 text-3xs text-faint">demonstration flywheel · simulated data</p>
            <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-3xs text-muted">
              <span>
                balance <span className="text-secondary">{fmt(flywheelBalance, 2)} SOL</span>
              </span>
              <span>
                routed <span className="text-secondary">{fmt(feesRouted, 2)} SOL</span>
              </span>
              <span>
                cycles <span className="text-secondary">{fmt(totalCycles)}</span>
              </span>
              <span>
                last cycle{" "}
                <span className="text-secondary">
                  {lastCycle ? fmtAgo(tick - lastCycle.atTick) : "—"}
                </span>
              </span>
            </div>
            <div className="mt-3 border-t border-line pt-2.5">
              <p className="mb-1.5 text-3xs text-faint">current allocation · momentum</p>
              <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-sm">
                {genesisAlloc.map((s) => (
                  <div
                    key={s.key}
                    style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                    title={`${s.label} ${s.pct}%`}
                  />
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {/* activate card */}
        <div className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded border border-dashed border-line-strong px-4 py-3.5 text-center">
          <Plus size={18} className="text-muted" />
          <p className="text-xs font-bold lowercase text-text">+ activate your flywheel</p>
          <p className="text-3xs text-faint">
            connect the creator wallet for an eligible Pump.fun token
          </p>
          <button
            onClick={() => openModal(connected ? "activate" : "wallet")}
            className={`${btn.solid} mt-1`}
          >
            {connected ? "activate a flywheel" : "connect creator wallet"}
          </button>
        </div>
      </div>
      {q && !genesisMatches ? (
        <p className="mt-3 text-center text-2xs text-faint">no flywheels match “{q}”</p>
      ) : null}
    </section>
  );
}
