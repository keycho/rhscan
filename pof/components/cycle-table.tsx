"use client";

import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePof } from "@/lib/store";
import { syntheticCycle } from "@/data/mock-data";
import { fmt, fmtAgo } from "@/lib/format";
import type { Cycle, CycleStatus } from "@/types";
import { Panel, PanelHeader, cx } from "@/components/ui";

const PAGE_SIZE = 8;
const TOTAL_PAGES = 48; // implied history depth (visual only)

type Filter = "All" | CycleStatus;

export function CycleTable() {
  const { cycles, tick } = usePof();
  const [filter, setFilter] = useState<Filter>("All");
  const [page, setPage] = useState(1);

  let rows: Cycle[];
  if (page === 1) {
    rows = cycles.filter((c) => filter === "All" || c.status === filter).slice(0, PAGE_SIZE);
  } else {
    const newest = cycles[0]?.epoch ?? 184;
    const start = newest - (page - 1) * PAGE_SIZE;
    rows = Array.from({ length: PAGE_SIZE }, (_, i) => syntheticCycle(start - i)).filter(
      (c) => c.epoch > 0 && (filter === "All" || c.status === filter)
    );
  }

  const th = "px-3 py-2 text-left font-mono text-3xs font-medium uppercase tracking-[0.12em] text-muted";
  const td = "px-3 py-2 font-mono text-2xs tabular-nums";

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="cycle timeline"
        right={
          <div className="flex gap-1">
            {(["All", "Complete", "Processing"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={cx(
                  "rounded-full border px-2 py-0.5 font-mono text-3xs uppercase tracking-wider transition-colors",
                  filter === f
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-line text-muted hover:text-secondary"
                )}
              >
                {f.toLowerCase()}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-line">
            <tr>
              <th className={th}>epoch</th>
              <th className={th}>fees in</th>
              <th className={th}>liquidity</th>
              <th className={th}>burn</th>
              <th className={th}>community</th>
              <th className={th}>status</th>
              <th className={cx(th, "text-right")}>time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows.map((c) => (
              <tr
                key={c.epoch}
                className={cx(
                  "transition-colors hover:bg-panel2/60",
                  c.atTick > 0 && "animate-row-flash"
                )}
              >
                <td className={cx(td, "font-semibold text-text")}>#{c.epoch}</td>
                <td className={cx(td, "text-text")}>{fmt(c.feesIn, 2)} SOL</td>
                <td className={cx(td, "text-secondary")}>{fmt(c.liquidity, 2)}</td>
                <td className={cx(td, "text-secondary")}>{fmt(c.burn, 2)}</td>
                <td className={cx(td, "text-secondary")}>{fmt(c.community, 2)}</td>
                <td className={td}>
                  {c.status === "Processing" ? (
                    <span className="inline-flex items-center gap-1.5 text-amber">
                      <Loader2 size={11} className="animate-spin" /> Processing
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-accent">
                      <CheckCircle2 size={11} /> Complete
                    </span>
                  )}
                </td>
                <td className={cx(td, "text-right text-muted")}>{fmtAgo(tick - c.atTick)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center font-mono text-2xs text-faint">
                  no {filter.toLowerCase()} cycles on this page
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-line px-3 py-2">
        <p className="font-mono text-3xs text-faint">
          page {page} of {TOTAL_PAGES} · {fmt(TOTAL_PAGES * PAGE_SIZE)} cycles archived
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-6 w-6 items-center justify-center rounded border border-line text-muted transition-colors hover:border-accent/40 hover:text-secondary disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(TOTAL_PAGES, p + 1))}
            disabled={page === TOTAL_PAGES}
            className="flex h-6 w-6 items-center justify-center rounded border border-line text-muted transition-colors hover:border-accent/40 hover:text-secondary disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </Panel>
  );
}
