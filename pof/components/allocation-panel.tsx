"use client";

import { useState } from "react";
import { Lock, Save } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";
import { usePof } from "@/lib/store";
import { ALLOCATION_MODES, MODE_NOTES } from "@/data/mock-data";
import type { EngineMode } from "@/types";
import { Panel, PanelHeader, cx } from "@/components/ui";

const MODES = Object.keys(ALLOCATION_MODES) as EngineMode[];

function DonutTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded border border-line bg-panel px-2.5 py-1.5 font-mono text-2xs shadow-lg">
      <span
        className="mr-1.5 inline-block h-2 w-2 rounded-sm"
        style={{ backgroundColor: (p.payload as { color: string }).color }}
      />
      <span className="text-text">{p.name}</span>
      <span className="ml-2 text-muted">{p.value}%</span>
    </div>
  );
}

export function AllocationPanel() {
  const { user, gate, toast } = usePof();
  const [mode, setMode] = useState<EngineMode>("Momentum");
  const slices = ALLOCATION_MODES[mode];

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="allocation engine"
        right={
          <button
            onClick={() =>
              gate("user", () => toast(`"${mode.toLowerCase()}" preset saved to draft engine`))
            }
            className="flex items-center gap-1.5 rounded border border-line px-2 py-1 font-mono text-3xs uppercase tracking-wider text-muted transition-colors hover:border-accent/40 hover:text-secondary"
          >
            {user ? <Save size={11} /> : <Lock size={11} />}
            save preset
          </button>
        }
      />

      <div className="px-4 pt-3">
        {/* mode pills */}
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cx(
                "rounded-full border px-2.5 py-1 font-mono text-3xs uppercase tracking-wider transition-colors",
                m === mode
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-line text-muted hover:border-line-strong hover:text-secondary"
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-3xs text-faint">{MODE_NOTES[mode]}</p>
      </div>

      <div className="grid flex-1 grid-cols-1 items-center gap-2 px-4 py-3 sm:grid-cols-[150px_1fr]">
        {/* donut */}
        <div className="relative mx-auto h-[150px] w-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="pct"
                nameKey="label"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={2}
                stroke="#0d100e"
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
                isAnimationActive
                animationDuration={600}
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-mono text-3xs uppercase tracking-wider text-muted">mode</p>
            <p className="font-mono text-xs font-semibold text-accent">{mode}</p>
          </div>
        </div>

        {/* rows */}
        <div className="space-y-1.5">
          {slices.map((s) => (
            <div key={s.key} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="w-36 truncate font-mono text-2xs text-secondary">{s.label}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-panel2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(s.pct / 50) * 100}%`, backgroundColor: s.color }}
                />
              </div>
              <span className="w-9 text-right font-mono text-2xs tabular-nums text-text">
                {s.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* segmented bar */}
      <div className="border-t border-line px-4 py-3">
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
          {slices.map((s) => (
            <div
              key={s.key}
              className="transition-all duration-500"
              style={{ width: `${s.pct}%`, backgroundColor: s.color }}
              title={`${s.label} ${s.pct}%`}
            />
          ))}
        </div>
        <p className="mt-2 font-mono text-3xs text-faint">
          preset applies from next epoch · simulated — no routing is executed
        </p>
      </div>
    </Panel>
  );
}
