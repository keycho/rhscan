"use client";

import { usePof } from "@/lib/store";
import { GENESIS } from "@/data/mock-data";
import { fmt, fmtCountdown } from "@/lib/format";
import { Card, LiveDot, PofMark } from "@/components/ui";
import { useCountUp } from "@/lib/use-count-up";

export function FeaturedFlywheel() {
  const { epoch, nextCycle, speed, feesRouted } = usePof();
  const routed = useCountUp(feesRouted);

  const cells = [
    { value: `${fmt(routed, 2)} SOL`, label: "claimed rewards routed" },
    { value: `${fmt(feesRouted * 0.35, 2)} SOL`, label: "to liquidity" },
    { value: `${GENESIS.burnedSupply} tokens`, label: "burned" },
    { value: `${fmt(feesRouted * 0.105, 2)} SOL`, label: "to holders" },
  ];

  return (
    <section className="mx-auto max-w-page px-4 pb-12">
      <p className="mb-3 text-center text-sm font-bold text-amber">⚙ genesis flywheel ⚙</p>
      <Card className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded border border-line bg-panel2 text-accent">
            <PofMark size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text">Proof of Flywheel</p>
            <p className="text-2xs text-accent">{GENESIS.ticker}</p>
          </div>
          <div className="ml-auto flex items-center gap-3 text-2xs">
            <span className="flex items-center gap-1.5 text-accent">
              <LiveDot /> active
            </span>
            <span className="text-secondary">cycle #{epoch}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-2xs">
          <span className="text-secondary">
            next cycle in <span className="font-bold text-accent">{fmtCountdown(nextCycle)}</span>
          </span>
          <span className="text-secondary">
            <span className="font-bold text-accent">{fmt(speed, 0)}%</span> wheel speed
          </span>
        </div>
        <div className="mx-4 mb-3 h-1 overflow-hidden rounded-full bg-panel2">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${speed}%` }}
          />
        </div>

        <p className="border-y border-line bg-panel2/60 px-4 py-2 text-center text-3xs text-secondary">
          claim on pump.fun <span className="text-accent">→</span> deposit rewards{" "}
          <span className="text-accent">→</span> execute routing cycle{" "}
          <span className="text-accent">→</span> liquidity / burns / holders / treasury
        </p>

        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {cells.map((c) => (
            <div key={c.label} className="bg-panel px-3 py-2.5 text-center">
              <p className="text-xs font-bold tabular-nums text-text">{c.value}</p>
              <p className="mt-0.5 text-3xs text-muted">{c.label}</p>
            </div>
          ))}
        </div>
        <p className="border-t border-line px-4 py-2 text-center text-3xs text-faint">
          reserve balances publish on-chain at launch
        </p>
      </Card>
    </section>
  );
}
