"use client";

import { useState } from "react";
import { Lock, Save } from "lucide-react";
import { usePof } from "@/lib/store";
import { ALLOCATION_MODES, MODE_NOTES } from "@/data/mock-data";
import type { EngineMode } from "@/types";
import { Card, SectionHead, cx } from "@/components/ui";

const MODES = Object.keys(ALLOCATION_MODES) as EngineMode[];

export function AllocationBar() {
  const { user, gate, toast } = usePof();
  const [mode, setMode] = useState<EngineMode>("Momentum");
  const slices = ALLOCATION_MODES[mode];

  return (
    <section className="mx-auto max-w-page px-4 pb-12">
      <SectionHead
        title="allocation engine"
        right="switch modes · weights apply from next cycle"
      />
      <Card>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-4 py-3">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cx(
                "rounded border px-2.5 py-1 text-2xs lowercase transition active:translate-y-px",
                m === mode
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-muted hover:border-line-strong hover:text-secondary"
              )}
            >
              {m}
            </button>
          ))}
          <button
            onClick={() => gate("user", () => toast(`"${mode.toLowerCase()}" preset saved`))}
            className="ml-auto flex items-center gap-1.5 rounded border border-line px-2 py-1 text-3xs lowercase text-muted transition hover:border-accent hover:text-accent"
          >
            {user ? <Save size={11} /> : <Lock size={11} />}
            save preset
          </button>
        </div>

        {/* terminal-style allocation line */}
        <p className="border-b border-line bg-panel2/60 px-4 py-2.5 text-center text-2xs font-bold tracking-wide text-text">
          {slices.map((s, i) => (
            <span key={s.key}>
              <span className="uppercase">{s.label}</span>{" "}
              <span className="text-accent">{s.pct}%</span>
              {i < slices.length - 1 ? <span className="text-faint"> | </span> : null}
            </span>
          ))}
        </p>

        <div className="px-4 py-3.5">
          {/* segmented bar */}
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-sm">
            {slices.map((s) => (
              <div
                key={s.key}
                className="transition-all duration-500"
                style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                title={`${s.label} ${s.pct}%`}
              />
            ))}
          </div>
          {/* per-slice bars */}
          <div className="mt-3.5 space-y-1.5">
            {slices.map((s) => (
              <div key={s.key} className="flex items-center gap-2.5">
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
                <span className="w-20 text-2xs text-secondary">{s.label}</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-panel2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(s.pct / 50) * 100}%`, backgroundColor: s.color }}
                  />
                </div>
                <span className="w-9 text-right text-2xs tabular-nums text-text">{s.pct}%</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-3xs text-faint">{MODE_NOTES[mode]}</p>
        </div>
      </Card>
    </section>
  );
}
