"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePof } from "@/lib/store";
import { ALLOCATION_MODES, GENESIS } from "@/data/mock-data";
import type { FlywheelDraft } from "@/types";
import { loadDraft } from "@/lib/drafts";
import { fmt, fmtAgo } from "@/lib/format";
import { Card, LiveDot, PofMark, SectionHead, btn } from "@/components/ui";

export function FlywheelsGrid() {
  const {
    totalCycles,
    feesRouted,
    flywheelBalance,
    cycles,
    tick,
    modal,
    openModal,
    setPendingActivate,
    searchQuery,
  } = usePof();
  const { connected, publicKey } = useWallet();
  const [draft, setDraft] = useState<FlywheelDraft | null>(null);

  // pick up the connected wallet's saved preview (re-check when modals close,
  // since the wizard may have just saved one)
  useEffect(() => {
    if (publicKey) {
      setDraft(loadDraft(publicKey.toBase58()));
    } else {
      setDraft(null);
    }
  }, [publicKey, modal]);

  const activate = () => {
    if (connected) {
      openModal("activate");
    } else {
      setPendingActivate(true);
      openModal("wallet");
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const lastCycle = cycles[0];
  const genesisAlloc = ALLOCATION_MODES.Momentum;
  const genesisMatches = !q || `genesis wheel $pof ${GENESIS.mint}`.toLowerCase().includes(q);
  const draftMatches =
    draft && (!q || `${draft.token.name} ${draft.token.symbol}`.toLowerCase().includes(q));

  return (
    <section id="flywheels" className="mx-auto max-w-page scroll-mt-20 px-4 pb-12">
      <SectionHead title="live flywheels" right="genesis engine preview" />
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

        {/* the connected wallet's saved preview */}
        {draftMatches && draft ? (
          <Link
            href="/preview"
            className="flex flex-col rounded border border-line bg-panel px-4 py-3.5 transition hover:border-accent/50"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded border border-line bg-panel2 text-2xs font-bold text-secondary">
                {draft.token.symbol.replace("$", "").slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-text">{draft.token.name}</p>
                <p className="text-2xs text-accent">
                  {draft.token.symbol}
                  {draft.token.demo ? <span className="text-faint"> · demo token</span> : null}
                </p>
              </div>
              <span className="ml-auto whitespace-nowrap rounded-full border border-amber/40 px-2 py-0.5 text-3xs lowercase text-amber">
                draft
              </span>
            </div>
            <p className="mt-2.5 flex-1 text-3xs text-muted">
              planned deposit{" "}
              <span className="text-secondary">{fmt(draft.plannedDeposit, 2)} SOL</span> ·{" "}
              {draft.mode.toLowerCase()} routing
            </p>
            <div className="mt-3 border-t border-line pt-2.5">
              <p className="mb-1.5 text-3xs text-faint">configuration ready · open preview →</p>
              <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-sm">
                {draft.weights.map((s) => (
                  <div
                    key={s.key}
                    style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                    title={`${s.label} ${s.pct}%`}
                  />
                ))}
              </div>
            </div>
          </Link>
        ) : null}

        {/* activate card */}
        <div className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded border border-dashed border-line-strong px-4 py-3.5 text-center">
          <Plus size={18} className="text-muted" />
          <p className="text-xs font-bold lowercase text-text">+ activate your flywheel</p>
          <p className="text-3xs text-faint">
            connect the creator wallet for an eligible Pump.fun token
          </p>
          <button onClick={activate} className={`${btn.solid} mt-1`}>
            {connected ? "activate a flywheel" : "connect creator wallet"}
          </button>
        </div>
      </div>
      {q && !genesisMatches && !draftMatches ? (
        <p className="mt-3 text-center text-2xs text-faint">no flywheels match “{q}”</p>
      ) : null}
    </section>
  );
}
