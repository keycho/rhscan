"use client";

import { Loader2 } from "lucide-react";
import { usePof } from "@/lib/store";
import { fmt, fmtAgo } from "@/lib/format";
import { SectionHead, cx } from "@/components/ui";

// pale-green highlight rows, like the reference's recent payout list
export function RecentCycles() {
  const { cycles, tick, toast } = usePof();
  const rows = cycles.slice(0, 8);

  return (
    <section id="activity" className="mx-auto max-w-page scroll-mt-20 px-4 pb-12">
      <SectionHead title="recent cycles" right="live · on-chain receipts at launch" />
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
                  · {fmt(c.liquidity, 2)} liquidity · {fmt(c.burn, 2)} burn ·{" "}
                  {fmt(c.community, 2)} holders
                </span>
              </p>
              {complete ? (
                <button
                  onClick={() => toast("tx receipts publish at launch", "info")}
                  className="shrink-0 font-bold underline decoration-pale-ink/40 underline-offset-2 transition hover:decoration-pale-ink"
                >
                  tx
                </button>
              ) : (
                <span className="flex shrink-0 items-center gap-1.5 text-amber">
                  <Loader2 size={11} className="animate-spin" /> processing
                </span>
              )}
              <span className={cx("w-16 shrink-0 text-right", complete ? "text-pale-ink/70" : "text-faint")}>
                {fmtAgo(tick - c.atTick)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
