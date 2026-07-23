"use client";

import { usePof } from "@/lib/store";
import { LiveDot, Pill, PofMark } from "@/components/ui";

const COLS = [
  {
    title: "product",
    links: ["Genesis Engine", "Launch Slots", "Engine Modes", "Allocation Presets"],
  },
  {
    title: "resources",
    links: ["Docs", "Public Page Examples", "Launch Requirements", "Brand Kit"],
  },
  {
    title: "community",
    links: ["X / Twitter", "Discord", "Telegram", "Engine Updates"],
  },
];

export function SiteFooter() {
  const { toast } = usePof();
  return (
    <footer className="mt-10 border-t border-line bg-panel">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <PofMark size={18} className="text-accent" />
            <span className="font-mono text-sm font-bold text-text">
              POF<span className="text-accent">_</span>
            </span>
          </div>
          <p className="mt-2 font-mono text-2xs text-accent">every trade turns the wheel</p>
          <p className="mt-1 max-w-[260px] text-2xs leading-4 text-muted">
            public flywheel dashboards for launch tokens. fees in. reserves build. momentum
            compounds.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="green">
              <LiveDot /> genesis engine live
            </Pill>
            <Pill tone="amber">no backend — showcase only</Pill>
          </div>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="font-mono text-3xs uppercase tracking-[0.16em] text-faint">{col.title}</p>
            <ul className="mt-2.5 space-y-1.5">
              {col.links.map((l) => (
                <li key={l}>
                  <button
                    onClick={() => toast(`${l.toLowerCase()} — not wired in this showcase`, "info")}
                    className="text-2xs text-muted transition-colors hover:text-accent"
                  >
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-2 px-4 py-3">
          <p className="font-mono text-3xs text-faint">
            © 2026 proof of flywheel · simulation mode · all data mocked locally
          </p>
          <p className="font-mono text-3xs text-faint">not a trading tool · nothing executes on-chain</p>
        </div>
      </div>
    </footer>
  );
}
