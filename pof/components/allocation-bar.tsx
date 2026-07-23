"use client";

import { useState } from "react";
import { Lock, Save } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePof } from "@/lib/store";
import { MODE_NOTES, ROUTING_DESCRIPTIONS } from "@/data/mock-data";
import type { AllocationSlice, EngineMode } from "@/types";
import { Card, SectionHead } from "@/components/ui";
import { RoutingEditor, TxPreview, slicesForMode, totalPct } from "@/components/routing-editor";

export function AllocationBar() {
  const { openModal, toast } = usePof();
  const { connected } = useWallet();
  const [mode, setMode] = useState<EngineMode>("Momentum");
  const [slices, setSlices] = useState<AllocationSlice[]>(() => slicesForMode("Momentum"));

  const save = () => {
    if (!connected) {
      openModal("wallet");
      return;
    }
    if (totalPct(slices) !== 100) {
      toast("allocation must total exactly 100%", "info");
      return;
    }
    toast("configuration preview saved locally — applies when the protocol goes live", "info");
  };

  return (
    <section className="mx-auto max-w-page px-4 pb-12">
      <SectionHead
        title="SOL routing configuration"
        right="choose how each deposited SOL cycle supports the token"
      />
      <Card>
        <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <RoutingEditor slices={slices} onChange={setSlices} mode={mode} onMode={setMode} />
            <p className="mt-3 text-3xs text-faint">{MODE_NOTES[mode]}</p>
            <button
              onClick={save}
              className="mt-3 flex items-center gap-1.5 rounded border border-line px-2.5 py-1.5 text-3xs lowercase text-muted transition hover:border-accent hover:text-accent"
            >
              {connected ? <Save size={11} /> : <Lock size={11} />}
              save configuration
            </button>
            <p className="mt-2 text-3xs text-faint">
              only the verified creator wallet can change the routing configuration, set treasury
              addresses, or pause the flywheel. every change requires a signed transaction.
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-2xs lowercase text-muted">transaction preview · 1 SOL cycle</p>
            <TxPreview slices={slices} amount={1} />
            <div className="mt-3 space-y-2">
              {slices.map((s) => (
                <p key={s.key} className="text-3xs leading-4 text-faint">
                  <span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                  <span className="text-muted">{s.label.toLowerCase()}:</span>{" "}
                  {ROUTING_DESCRIPTIONS[s.key]}
                </p>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
