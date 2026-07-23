"use client";

import { usePof } from "@/lib/store";
import { fmt, fmtCountdown } from "@/lib/format";
import { LiveDot } from "@/components/ui";

export function StatusStrip() {
  const { epoch, nextCycle, feesRouted, speed, totalCycles } = usePof();
  const item = "flex shrink-0 items-center gap-1.5";
  const label = "text-faint";
  return (
    <div className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-page items-center gap-5 overflow-x-auto px-4 py-1.5 font-mono text-3xs uppercase tracking-[0.1em] text-secondary [scrollbar-width:none]">
        <span className={item}>
          <LiveDot />
          engine_001/genesis
        </span>
        <span className={item}>
          <span className={label}>epoch</span> #{epoch}
        </span>
        <span className={item}>
          <span className={label}>next cycle</span>
          <span className="text-accent">{fmtCountdown(nextCycle)}</span>
        </span>
        <span className={item}>
          <span className={label}>fees routed</span> {fmt(feesRouted, 1)} SOL
        </span>
        <span className={item}>
          <span className={label}>speed</span> {fmt(speed, 0)}%
        </span>
        <span className={item}>
          <span className={label}>cycles</span> {fmt(totalCycles)}
        </span>
        <span className="ml-auto hidden shrink-0 text-faint sm:block">
          sim mode · no backend · showcase only
        </span>
      </div>
    </div>
  );
}
