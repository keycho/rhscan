"use client";

import { TrendingUp, Minus, ArrowUpRight } from "lucide-react";
import { GENESIS, HEALTH_METRICS, MOMENTUM_SPARK } from "@/data/mock-data";
import { fmt } from "@/lib/format";
import { Sparkline } from "@/components/sparkline";
import { Panel, PanelHeader, cx } from "@/components/ui";

function HealthBadge({ badge }: { badge: string }) {
  const style =
    badge === "Strong"
      ? "border-accent/30 bg-accent/10 text-accent"
      : badge === "Rising"
        ? "border-amber/30 bg-amber/10 text-amber"
        : "border-line bg-panel2 text-secondary";
  const Icon = badge === "Strong" ? TrendingUp : badge === "Rising" ? ArrowUpRight : Minus;
  return (
    <span
      className={cx(
        "inline-flex w-[4.5rem] items-center justify-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-3xs uppercase tracking-wider",
        style
      )}
    >
      <Icon size={10} />
      {badge}
    </span>
  );
}

export function MomentumPanel() {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="momentum / health"
        right={<span className="font-mono text-3xs text-faint">sampled every epoch</span>}
      />

      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="font-mono text-3xs uppercase tracking-[0.14em] text-muted">
            momentum · since genesis
          </p>
          <p className="mt-0.5 font-mono text-2xl font-bold tabular-nums text-accent">
            {fmt(GENESIS.momentumScore, 0)}
            <span className="ml-1 text-xs font-medium text-muted">/ 100</span>
          </p>
        </div>
        <Sparkline data={MOMENTUM_SPARK} width={150} height={40} />
      </div>

      <div className="flex-1 space-y-3 px-4 py-3.5">
        {HEALTH_METRICS.map((m) => (
          <div key={m.key} className="flex items-center gap-3">
            <span className="w-36 shrink-0 font-mono text-2xs text-secondary">{m.label}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-panel2">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700"
                style={{ width: `${m.value}%`, opacity: 0.45 + (m.value / 100) * 0.55 }}
              />
            </div>
            <span className="w-7 text-right font-mono text-2xs tabular-nums text-text">
              {m.value}
            </span>
            <HealthBadge badge={m.badge} />
          </div>
        ))}
      </div>

      <div className="border-t border-line px-4 py-2">
        <p className="font-mono text-3xs text-faint">
          proof that the engine is alive — composite of cycle cadence, reserve depth and routed flow
        </p>
      </div>
    </Panel>
  );
}
