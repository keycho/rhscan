"use client";

import type { ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePof } from "@/lib/store";
import { SectionHead, cx } from "@/components/ui";

// no onchain cycles have occurred yet, so this section renders a truthful
// empty state. the pale-green row design below is preserved for genuine
// transaction data and is not rendered until real cycles exist.
export function RecentCycles() {
  const { openModal, setPendingActivate } = usePof();
  const { connected } = useWallet();

  const activate = () => {
    if (connected) {
      openModal("activate");
    } else {
      setPendingActivate(true);
      openModal("wallet");
    }
  };

  const stats = [
    { value: "0", label: "cycles" },
    { value: "0.00 SOL", label: "routed" },
    { value: "0", label: "active vaults" },
    { value: "Solana", label: "network" },
  ];

  return (
    <section id="activity" className="mx-auto max-w-page scroll-mt-20 px-4 pb-12">
      <SectionHead
        title="recent cycles"
        right={
          <span className="flex items-center gap-1.5 text-3xs lowercase text-amber">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber" /> awaiting first
            onchain cycle
          </span>
        }
      />

      <div className="rounded border border-line bg-panel">
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-text">NO CYCLES RECORDED</p>
          <p className="mx-auto mt-3 max-w-md text-2xs leading-5 text-secondary">
            the engine is watching for its first creator-funded flywheel.
            <br />
            completed routing cycles and onchain receipts will appear here.
          </p>
        </div>

        <div className="border-t border-line bg-bg px-5 py-3.5 text-2xs leading-6">
          <p className="text-secondary">
            <span className="text-faint">&gt;</span> watching flywheel registry...
          </p>
          <p className="text-secondary">
            <span className="text-faint">&gt;</span> awaiting first creator deposit...
          </p>
          <p className="text-secondary">
            <span className="text-faint">&gt;</span> no onchain receipts yet{" "}
            <span className="ml-0.5 inline-block h-3 w-[7px] translate-y-px animate-blink bg-accent align-middle" />
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-panel px-3 py-2.5 text-center">
              <p className="text-xs font-bold tabular-nums text-text">{s.value}</p>
              <p className="mt-0.5 text-3xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-line px-5 py-3 text-center">
          <button
            onClick={activate}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-accent bg-accent px-3.5 py-2 text-xs font-bold text-accent-ink transition hover:bg-[#71f5a3] active:translate-y-px"
          >
            activate the first flywheel →
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * pale-green cycle row, reserved for genuine transaction data. not rendered
 * anywhere until real onchain cycles exist — do not feed it generated data.
 */
export function RealCycleRow({
  summary,
  right,
  time,
  highlight = true,
}: {
  summary: string;
  right?: ReactNode;
  time: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded border px-3.5 py-2.5 text-2xs",
        highlight ? "border-pale/20 bg-pale text-pale-ink" : "border-line bg-panel text-secondary"
      )}
    >
      <p className="min-w-0 flex-1 truncate">{summary}</p>
      {right}
      <span className={cx("w-16 shrink-0 text-right", highlight ? "text-pale-ink/70" : "text-faint")}>
        {time}
      </span>
    </div>
  );
}
