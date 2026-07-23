"use client";

import { usePof } from "@/lib/store";
import { fmt, fmtAgo } from "@/lib/format";
import { cx } from "@/components/ui";

// two live strips under the nav. row 1: protocol status pills.
// row 2: thin feed of engine events (simulated — see activity section).
export function Tickers() {
  const { activity, cycles, tick } = usePof();
  const settled = cycles.find((c) => c.status === "Complete");

  const pills = [
    "creator-funded flywheels live",
    "deposit SOL → execute routing cycle",
    "connect creator wallet → detect eligible tokens",
    settled ? `cycle complete · ${fmt(settled.feesIn, 2)} SOL routed` : "",
  ].filter(Boolean);

  const feed = activity.slice(0, 8);

  return (
    <div className="border-b border-line">
      {/* pill ticker */}
      <div className="marquee-mask overflow-hidden border-b border-line py-1.5">
        <div className="marquee-track animate-marquee-slow gap-2 pr-2">
          {[0, 1].map((half) => (
            <div key={half} className="flex shrink-0 gap-2" aria-hidden={half === 1}>
              {pills.map((p, i) => (
                <span
                  key={`${half}-${i}`}
                  className="whitespace-nowrap rounded-full border border-accent/40 px-3 py-0.5 text-2xs text-accent"
                >
                  {p}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* thin event ticker */}
      <div className="marquee-mask overflow-hidden bg-panel py-1">
        <div className="marquee-track animate-marquee-fast gap-6 pr-6">
          {[0, 1].map((half) => (
            <div key={half} className="flex shrink-0 gap-6" aria-hidden={half === 1}>
              {feed.map((e) => (
                <span
                  key={`${half}-${e.id}`}
                  className="flex items-center gap-1.5 whitespace-nowrap text-2xs text-secondary"
                >
                  <span
                    className={cx(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      e.tone === "green" ? "bg-accent" : e.tone === "amber" ? "bg-amber" : "bg-faint"
                    )}
                  />
                  {e.text}
                  <span className="text-faint">· {fmtAgo(tick - e.atTick)}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
