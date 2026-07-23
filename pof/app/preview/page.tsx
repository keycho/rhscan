"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { AppShell } from "@/components/app-shell";
import { usePof } from "@/lib/store";
import type { FlywheelDraft } from "@/types";
import { loadDraft } from "@/lib/drafts";
import { shortAddress } from "@/components/solana-provider";
import { useSolBalance } from "@/lib/use-sol-balance";
import { fmt } from "@/lib/format";
import { Card, PofMark, btn } from "@/components/ui";
import { TxPreview } from "@/components/routing-editor";

function PreviewContent() {
  const { openModal, setPendingActivate, modal } = usePof();
  const { connected, publicKey } = useWallet();
  const balance = useSolBalance();
  const [draft, setDraft] = useState<FlywheelDraft | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (publicKey) {
      setDraft(loadDraft(publicKey.toBase58()));
    } else {
      setDraft(null);
    }
    setReady(true);
  }, [publicKey, modal]);

  if (!connected || !publicKey) {
    return (
      <main className="mx-auto max-w-page px-4 py-16 text-center">
        <PofMark size={28} className="mx-auto text-accent" />
        <h1 className="mt-4 text-xl font-bold lowercase text-accent">your flywheel preview</h1>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-secondary">
          previews are saved to this browser under your public wallet address. connect your
          wallet to see yours.
        </p>
        <button onClick={() => openModal("wallet")} className={`${btn.solid} mt-5`}>
          connect creator wallet
        </button>
      </main>
    );
  }

  if (ready && !draft) {
    return (
      <main className="mx-auto max-w-page px-4 py-16 text-center">
        <PofMark size={28} className="mx-auto text-accent" />
        <h1 className="mt-4 text-xl font-bold lowercase text-accent">no preview yet</h1>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-secondary">
          no flywheel preview is saved for{" "}
          <span className="text-accent">{shortAddress(publicKey.toBase58())}</span> in this
          browser. run the creation flow to build one.
        </p>
        <button
          onClick={() => {
            setPendingActivate(false);
            openModal("activate");
          }}
          className={`${btn.solid} mt-5`}
        >
          activate a flywheel
        </button>
      </main>
    );
  }

  if (!draft) return <main className="min-h-[40vh]" />;

  const slices = draft.weights;

  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h1 className="text-xl font-bold lowercase text-accent">your flywheel preview</h1>
          <span className="rounded-full border border-amber/40 px-2.5 py-0.5 text-3xs lowercase text-amber">
            draft
          </span>
        </div>
        <p className="mt-1 text-3xs text-faint">
          configuration ready · awaiting protocol activation
        </p>

        <Card className="mt-4">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded border border-line bg-panel2 text-xs font-bold text-accent">
              {draft.token.symbol.replace("$", "").slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text">{draft.token.name}</p>
              <p className="text-2xs text-accent">
                {draft.token.symbol}
                {draft.token.demo ? (
                  <span className="ml-1.5 rounded-full border border-amber/40 px-1.5 py-px text-3xs lowercase text-amber">
                    demo token
                  </span>
                ) : null}
              </p>
            </div>
            <div className="ml-auto text-right text-3xs text-muted">
              <p>
                creator wallet{" "}
                <span className="text-accent">{shortAddress(draft.owner)}</span>
              </p>
              <p className="mt-0.5">
                wallet balance{" "}
                <span className="text-secondary">
                  {balance !== null ? `${fmt(balance, 2)} SOL` : "—"}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            <div className="bg-panel px-3 py-2.5 text-center">
              <p className="text-xs font-bold tabular-nums text-text">
                {fmt(draft.plannedDeposit, 2)} SOL
              </p>
              <p className="mt-0.5 text-3xs text-muted">planned deposit</p>
            </div>
            <div className="bg-panel px-3 py-2.5 text-center">
              <p className="text-xs font-bold lowercase text-text">{draft.mode}</p>
              <p className="mt-0.5 text-3xs text-muted">routing mode</p>
            </div>
            <div className="bg-panel px-3 py-2.5 text-center">
              <p className="text-xs font-bold tabular-nums text-text">{draft.slippagePct}%</p>
              <p className="mt-0.5 text-3xs text-muted">slippage</p>
            </div>
            <div className="bg-panel px-3 py-2.5 text-center">
              <p className="text-xs font-bold tabular-nums text-text">~0.003 SOL</p>
              <p className="mt-0.5 text-3xs text-muted">est. network cost</p>
            </div>
          </div>

          <div className="border-t border-line px-4 py-3.5">
            <p className="mb-1.5 text-2xs lowercase text-muted">routing configuration</p>
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-sm">
              {slices.map((s) => (
                <div
                  key={s.key}
                  style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                  title={`${s.label} ${s.pct}%`}
                />
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
              {slices.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5 text-3xs text-muted">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                  {s.label} <span className="text-secondary">{s.pct}%</span>
                </span>
              ))}
            </div>

            <p className="mb-1.5 mt-4 text-2xs lowercase text-muted">
              estimated allocation per {fmt(draft.plannedDeposit, 2)} SOL cycle
            </p>
            <TxPreview
              slices={slices.map((s) => ({ ...s }))}
              amount={draft.plannedDeposit}
            />

            <p className="mt-3 text-3xs text-faint">
              treasury destination ·{" "}
              <span className="text-secondary">{shortAddress(draft.treasury)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
            <p className="max-w-60 text-3xs leading-4 text-faint">
              this is a saved configuration preview — no transaction was submitted and no SOL
              moved.
            </p>
            <div className="flex gap-2">
              <Link href="/?activate=1" className={btn.outline}>
                edit configuration
              </Link>
              <Link href="/?activate=1&fresh=1" className={btn.solid}>
                start another preview
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default function PreviewPage() {
  return (
    <AppShell>
      <PreviewContent />
    </AppShell>
  );
}
