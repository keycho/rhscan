"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { usePof } from "@/lib/store";
import { ALLOCATION_MODES } from "@/data/mock-data";
import { fmt, fmtAgo } from "@/lib/format";
import { SectionHead, cx } from "@/components/ui";

// pale-green rows of executed routing cycles. splits are derived from the
// genesis momentum weights so every row matches the configured allocation.
export function RecentCycles() {
  const { cycles, tick, toast } = usePof();
  const rows = cycles.slice(0, 8);
  const w = Object.fromEntries(ALLOCATION_MODES.Momentum.map((s) => [s.key, s.pct / 100]));

  return (
    <section id="activity" className="mx-auto max-w-page scroll-mt-20 px-4 pb-12">
      <SectionHead title="recent cycles" right="PROTOCOL SIMULATION · demonstration data" />
      <div className="space-y-1.5">
        {rows.map((c) => {
          const complete = c.status === "Complete";
          return (
            <div
              key={c.epoch}
              className={cx(
                "flex items-center gap-3 rounded border px-3.5 py-2.5 text-2xs",
                complete
                  ? "border-pale/20 bg-pale text-pale-ink"
                  : "border-amber/40 bg-panel text-secondary",
                c.atTick > 0 && "animate-feed-in"
              )}
            >
              <p className="min-w-0 flex-1 truncate">
                <span className="font-bold">cycle #{c.epoch}</span> routed{" "}
                <span className="font-bold">{fmt(c.feesIn, 2)} SOL</span>
                <span className={complete ? "text-pale-ink/70" : "text-muted"}>
                  {" "}
                  · {fmt(c.feesIn * w.liq, 2)} liquidity · {fmt(c.feesIn * w.burn, 2)} buyback ·{" "}
                  {fmt(c.feesIn * w.comm, 2)} holder vault · {fmt(c.feesIn * w.trea, 2)} treasury ·{" "}
                  {fmt(c.feesIn * w.acq, 2)} growth
                </span>
              </p>
              {complete ? (
                <>
                  <span className="flex shrink-0 items-center gap-1 font-bold">
                    <CheckCircle2 size={11} /> confirmed
                  </span>
                  <button
                    onClick={() => toast("simulated cycle — explorer links activate with real transactions", "info")}
                    className="shrink-0 font-bold underline decoration-pale-ink/40 underline-offset-2 transition hover:decoration-pale-ink"
                  >
                    tx ↗
                  </button>
                </>
              ) : (
                <span className="flex shrink-0 items-center gap-1.5 text-amber">
                  <Loader2 size={11} className="animate-spin" /> confirming
                </span>
              )}
              <span
                className={cx(
                  "w-16 shrink-0 text-right",
                  complete ? "text-pale-ink/70" : "text-faint"
                )}
              >
                {fmtAgo(tick - c.atTick)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
