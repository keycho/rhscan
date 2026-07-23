"use client";

import { Minus, Plus } from "lucide-react";
import { ALLOCATION_MODES } from "@/data/mock-data";
import type { AllocationSlice, EngineMode } from "@/types";
import { fmt } from "@/lib/format";
import { cx } from "@/components/ui";

export const MODES = Object.keys(ALLOCATION_MODES) as EngineMode[];

export function slicesForMode(mode: EngineMode): AllocationSlice[] {
  return ALLOCATION_MODES[mode].map((s) => ({ ...s }));
}

export function totalPct(slices: AllocationSlice[]): number {
  return slices.reduce((sum, s) => sum + s.pct, 0);
}

/**
 * adjustable routing weights in 5% steps. the parent owns the slices state;
 * actions that persist or execute must check totalPct === 100.
 */
export function RoutingEditor({
  slices,
  onChange,
  mode,
  onMode,
}: {
  slices: AllocationSlice[];
  onChange: (next: AllocationSlice[]) => void;
  mode: EngineMode;
  onMode: (m: EngineMode) => void;
}) {
  const total = totalPct(slices);

  const bump = (key: string, delta: number) => {
    onChange(
      slices.map((s) =>
        s.key === key ? { ...s, pct: Math.min(80, Math.max(0, s.pct + delta)) } : s
      )
    );
  };

  return (
    <div>
      {/* presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => {
              onMode(m);
              onChange(slicesForMode(m));
            }}
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
        <span
          className={cx(
            "ml-auto rounded border px-2 py-0.5 text-3xs tabular-nums",
            total === 100 ? "border-accent/40 text-accent" : "border-negative/50 text-negative"
          )}
        >
          total {fmt(total)}%
        </span>
      </div>

      {/* segmented bar */}
      <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-sm">
        {slices.map((s) =>
          s.pct > 0 ? (
            <div
              key={s.key}
              className="transition-all duration-300"
              style={{ width: `${s.pct}%`, backgroundColor: s.color }}
              title={`${s.label} ${s.pct}%`}
            />
          ) : null
        )}
        {total < 100 ? <div className="bg-panel2" style={{ width: `${100 - total}%` }} /> : null}
      </div>

      {/* steppers */}
      <div className="mt-3 space-y-1.5">
        {slices.map((s) => (
          <div key={s.key} className="flex items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="w-28 text-2xs text-secondary">{s.label}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-panel2">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(s.pct / 80) * 100}%`, backgroundColor: s.color }}
              />
            </div>
            <button
              onClick={() => bump(s.key, -5)}
              disabled={s.pct <= 0}
              aria-label={`decrease ${s.label}`}
              className="flex h-5 w-5 items-center justify-center rounded border border-line text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
            >
              <Minus size={10} />
            </button>
            <span className="w-9 text-right text-2xs tabular-nums text-text">{s.pct}%</span>
            <button
              onClick={() => bump(s.key, 5)}
              disabled={s.pct >= 80}
              aria-label={`increase ${s.label}`}
              className="flex h-5 w-5 items-center justify-center rounded border border-line text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
            >
              <Plus size={10} />
            </button>
          </div>
        ))}
      </div>
      {total !== 100 ? (
        <p className="mt-2 text-3xs text-negative">allocation must total exactly 100%</p>
      ) : null}
    </div>
  );
}

/** terminal-style transaction preview for a given deposit */
export function TxPreview({ slices, amount = 1 }: { slices: AllocationSlice[]; amount?: number }) {
  return (
    <div className="rounded border border-line bg-bg px-3 py-2.5 text-2xs leading-5">
      <p className="text-secondary">
        deposit: <span className="text-text">{fmt(amount, 2)} SOL</span>
      </p>
      {slices.map((s) => (
        <p key={s.key} className="text-muted">
          {s.label.toLowerCase()}:{" "}
          <span className="text-secondary">{fmt((amount * s.pct) / 100, 2)} SOL</span>
        </p>
      ))}
      <p className="text-faint">estimated network cost: ~0.003 SOL</p>
    </div>
  );
}
