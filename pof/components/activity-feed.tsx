"use client";

import { usePof } from "@/lib/store";
import { fmtAgo } from "@/lib/format";
import { LiveDot, Panel, PanelHeader, cx } from "@/components/ui";

const TAG_STYLES: Record<string, string> = {
  cycle: "border-accent/30 text-accent",
  engine: "border-accent/30 text-accent",
  reserve: "border-line text-secondary",
  burn: "border-amber/30 text-amber",
  launch: "border-amber/30 text-amber",
  docs: "border-line text-secondary",
};

export function ActivityFeed() {
  const { activity, tick } = usePof();
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="activity feed"
        right={
          <span className="flex items-center gap-1.5 font-mono text-3xs uppercase tracking-wider text-accent">
            <LiveDot /> live
          </span>
        }
      />
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 space-y-0 overflow-y-auto px-1 py-1">
          {activity.map((e) => (
            <div
              key={e.id}
              className={cx(
                "flex items-start gap-2 rounded px-2 py-1.5 transition-colors hover:bg-panel2/60",
                e.atTick > 0 && tick - e.atTick < 3 && "animate-feed-in"
              )}
            >
              <span className="w-14 shrink-0 pt-px text-right font-mono text-3xs tabular-nums text-faint">
                {fmtAgo(tick - e.atTick)}
              </span>
              <span
                className={cx(
                  "shrink-0 rounded-sm border px-1 py-px font-mono text-3xs lowercase",
                  TAG_STYLES[e.tag] ?? TAG_STYLES.docs
                )}
              >
                {e.tag}
              </span>
              <span className="font-mono text-2xs leading-4 text-secondary">{e.text}</span>
            </div>
          ))}
        </div>
        {/* bottom fade — implies more history */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-panel to-transparent" />
      </div>
      <div className="border-t border-line px-3 py-2">
        <p className="font-mono text-3xs text-faint">
          public event stream · every allocation, burn and milestone is logged
        </p>
      </div>
    </Panel>
  );
}
