// 14-day transactions-per-day chart, rendered server-side as css bars (no client
// javascript, no layout measurement). the indexed window only spans a few days of
// this chain, so most of the 14-day axis has no indexed data; those days render
// as a faint baseline rather than a zero bar, and the caption discloses that the
// chart covers the indexed window only.

import { formatNumber } from "@/src/web/format";
import type { DayBucket } from "@/src/web/stats";

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function TxChart({ buckets, days = 14 }: { buckets: DayBucket[]; days?: number }) {
  const byDay = new Map(buckets.map((b) => [b.day, b]));
  const axis = lastNDays(days);
  const max = Math.max(1, ...buckets.map((b) => b.txCount));
  const indexedDays = buckets.length;

  return (
    <div>
      <div className="flex h-[150px] items-end gap-[3px] px-1">
        {axis.map((day) => {
          const b = byDay.get(day);
          if (!b) {
            return (
              <div key={day} className="group relative flex-1" title={`${day}: no indexed data`}>
                <div className="h-px w-full bg-border" />
              </div>
            );
          }
          const pct = Math.max(3, Math.round((b.txCount / max) * 100));
          return (
            <div
              key={day}
              className="group relative flex flex-1 items-end"
              style={{ height: "100%" }}
              title={`${day}: ${formatNumber(b.txCount)} txns across ${formatNumber(b.blocks)} blocks`}
            >
              <div
                className="w-full rounded-sm bg-accent/70 group-hover:bg-accent"
                style={{ height: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between px-1 text-2xs text-faint">
        <span className="mono">{axis[0]}</span>
        <span className="mono">{axis[axis.length - 1]}</span>
      </div>
      <p className="mt-2 text-2xs leading-relaxed text-faint">
        transactions per day. the index holds a rolling recent window, so only the
        last {indexedDays} day{indexedDays === 1 ? "" : "s"} shown carry indexed
        data; earlier days on the axis are outside the window.
      </p>
    </div>
  );
}
