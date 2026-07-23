"use client";

import type { ReactNode } from "react";
import { usePof } from "@/lib/store";
import { GENESIS } from "@/data/mock-data";
import { fmt, fmtCountdown } from "@/lib/format";
import { FeesChart } from "@/components/fees-chart";
import { LiveDot, Panel, PanelHeader, Pill } from "@/components/ui";

export function GenesisPanel() {
  const { epoch, nextCycle, feesRouted, totalCycles } = usePof();

  const facts: [string, ReactNode][] = [
    ["token", GENESIS.tokenName],
    ["ticker", <span key="t" className="text-accent">{GENESIS.ticker}</span>],
    ["status", <span key="s" className="inline-flex items-center gap-1.5 text-accent"><LiveDot /> Live</span>],
    ["engine id", GENESIS.engineId],
    ["network", GENESIS.network],
    ["platform", GENESIS.platform],
    ["engine mode", GENESIS.mode],
    ["current epoch", `#${epoch}`],
    ["next cycle", <span key="n" className="text-accent">{fmtCountdown(nextCycle)}</span>],
  ];

  const metrics: { label: string; value: string; pending?: boolean }[] = [
    { label: "fees routed", value: `${fmt(feesRouted, 1)} SOL` },
    { label: "total cycles", value: fmt(totalCycles) },
    { label: "liquidity reserve", value: "—", pending: true },
    { label: "burn reserve", value: "—", pending: true },
    { label: "community reserve", value: "—", pending: true },
    { label: "total routed value", value: GENESIS.totalRoutedValue },
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      <Panel>
        <PanelHeader title="genesis engine · manifest" right={<Pill tone="green">genesis wheel live</Pill>} />
        <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 px-4 py-3">
          {facts.map(([label, value]) => (
            <div key={label}>
              <p className="font-mono text-3xs uppercase tracking-wider text-faint">{label}</p>
              <p className="mt-0.5 font-mono text-xs text-text">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className="bg-panel px-4 py-2.5">
              <p className="font-mono text-3xs uppercase tracking-wider text-muted">{m.label}</p>
              <p
                className={`mt-0.5 font-mono text-base font-semibold tabular-nums ${
                  m.pending ? "text-muted" : "text-text"
                }`}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-line px-4 py-2">
          <p className="font-mono text-3xs text-faint">
            reserve balances are never simulated — they publish from on-chain accounts at launch
          </p>
        </div>
      </Panel>

      <Panel className="flex-1">
        <PanelHeader
          title="fees routed per epoch · since genesis"
          right={<span className="font-mono text-3xs text-faint">SOL / epoch</span>}
        />
        <div className="px-3 pb-2 pt-3">
          <FeesChart />
        </div>
      </Panel>
    </div>
  );
}
