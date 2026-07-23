"use client";

import { ArrowRight, CircleDashed, Lock } from "lucide-react";
import { usePof } from "@/lib/store";
import { SLOTS, SLOT_STATS } from "@/data/mock-data";
import { LiveDot, Panel, PanelHeader, Pill, btn, cx } from "@/components/ui";

export function OpenSlots() {
  const { user, gate, toast } = usePof();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="lg:col-span-2">
        <PanelHeader
          title="launch slots · genesis board"
          right={<Pill tone="green">multi-token ready</Pill>}
        />
        <div className="divide-y divide-line/60">
          {SLOTS.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-panel2/50"
            >
              <span className="w-24 shrink-0 font-mono text-3xs uppercase tracking-wider text-faint">
                {slot.id}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs font-semibold text-text">{slot.label}</p>
                <p className="truncate font-mono text-3xs text-faint">{slot.note}</p>
              </div>
              <span
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-3xs uppercase tracking-wider",
                  slot.tone === "live" && "border-accent/40 bg-accent/10 text-accent",
                  slot.tone === "open" && "border-line bg-panel2 text-secondary",
                  slot.tone === "reserved" && "border-amber/30 bg-amber/10 text-amber"
                )}
              >
                {slot.tone === "live" ? <LiveDot /> : <CircleDashed size={10} />}
                {slot.status}
              </span>
              {slot.tone === "open" ? (
                <button
                  onClick={() =>
                    gate("user", () =>
                      toast(`application submitted for ${slot.label.toLowerCase()} (demo)`)
                    )
                  }
                  className="flex items-center gap-1 rounded border border-line px-2 py-1 font-mono text-3xs uppercase tracking-wider text-muted transition-colors hover:border-accent/50 hover:text-accent"
                >
                  {user ? null : <Lock size={9} />}
                  apply
                </button>
              ) : (
                <span className="w-[52px]" />
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-line px-4 py-2.5">
          <p className="font-mono text-3xs text-faint">
            no fake tickers here — slots fill in launch order. genesis proved the loop; the board
            is open.
          </p>
        </div>
      </Panel>

      <Panel className="flex flex-col">
        <PanelHeader title="board status" />
        <div className="grid flex-1 grid-cols-2 gap-px bg-line">
          {SLOT_STATS.map((s) => (
            <div key={s.label} className="flex flex-col justify-center bg-panel px-4 py-3">
              <p className="font-mono text-3xs uppercase tracking-wider text-muted">{s.label}</p>
              <p className="mt-1 font-mono text-lg font-bold text-accent">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-line p-3">
          <button
            onClick={() =>
              gate("user", () => toast("application submitted for slot #02 (demo)"))
            }
            className={`${btn.primary} w-full justify-center`}
          >
            be the next token on the board <ArrowRight size={13} />
          </button>
        </div>
      </Panel>
    </div>
  );
}
