"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { usePof } from "@/lib/store";
import { GENESIS } from "@/data/mock-data";
import { fmt } from "@/lib/format";
import { Card, LiveDot, PofMark, SectionHead, cx } from "@/components/ui";

type SlotFilter = "all" | "live" | "open" | "reserved";

interface BoardCard {
  id: string;
  initials: string;
  name: string;
  ticker: string;
  desc: string;
  status: "live" | "open" | "reserved";
}

const BOARD: BoardCard[] = [
  {
    id: "genesis",
    initials: "",
    name: "Genesis Wheel",
    ticker: "$POF",
    desc: "pump.fun fees routed through the genesis loop",
    status: "live",
  },
  { id: "slot_02", initials: "02", name: "Open Slot #02", ticker: "———", desc: "next launch window — today", status: "open" },
  { id: "slot_03", initials: "03", name: "Open Slot #03", ticker: "———", desc: "applications open", status: "open" },
  { id: "slot_04", initials: "04", name: "Open Slot #04", ticker: "———", desc: "applications open", status: "open" },
  { id: "slot_05", initials: "05", name: "Slot #05", ticker: "———", desc: "reserved for launch", status: "reserved" },
];

export function FlywheelsGrid() {
  const { totalCycles, feesRouted, speed, gate, toast, openModal, searchQuery } = usePof();
  const [filter, setFilter] = useState<SlotFilter>("all");

  const q = searchQuery.trim().toLowerCase();
  const cards = BOARD.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      (!q || `${c.name} ${c.ticker} ${c.desc}`.toLowerCase().includes(q))
  );

  return (
    <section id="flywheels" className="mx-auto max-w-page scroll-mt-20 px-4 pb-12">
      <SectionHead
        title="live flywheels"
        right={
          <span className="flex gap-1">
            {(["all", "live", "open", "reserved"] as SlotFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cx(
                  "rounded border px-2 py-0.5 text-3xs lowercase transition",
                  filter === f
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line text-muted hover:text-secondary"
                )}
              >
                {f}
              </button>
            ))}
          </span>
        }
      />
      <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.id} className="flex flex-col px-4 py-3.5 transition hover:border-line-strong">
            <div className="flex items-center gap-2.5">
              <span
                className={cx(
                  "flex h-9 w-9 items-center justify-center rounded border text-2xs font-bold",
                  c.status === "live"
                    ? "border-accent/50 bg-panel2 text-accent"
                    : "border-line bg-panel2 text-muted"
                )}
              >
                {c.id === "genesis" ? <PofMark size={20} /> : c.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-text">{c.name}</p>
                <p className={cx("text-2xs", c.status === "live" ? "text-accent" : "text-faint")}>
                  {c.ticker}
                </p>
              </div>
              <span
                className={cx(
                  "ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-3xs lowercase",
                  c.status === "live" && "border-accent/40 text-accent",
                  c.status === "open" && "border-line-strong text-secondary",
                  c.status === "reserved" && "border-amber/40 text-amber"
                )}
              >
                {c.status === "live" ? <LiveDot /> : null}
                {c.status === "live" ? "active" : c.status === "open" ? "available" : "reserved"}
              </span>
            </div>
            <p className="mt-2.5 flex-1 text-2xs leading-4 text-secondary">{c.desc}</p>
            <div className="mt-3 border-t border-line pt-2 text-3xs text-muted">
              {c.status === "live" ? (
                <>
                  {fmt(totalCycles)} cycles · {fmt(feesRouted, 1)} SOL routed ·{" "}
                  {fmt(speed, 0)}% speed
                </>
              ) : c.status === "open" ? (
                <button
                  onClick={() => gate("user", () => toast(`application submitted for ${c.name.toLowerCase()}`))}
                  className="text-accent transition hover:underline"
                >
                  0 cycles · awaiting token · apply →
                </button>
              ) : (
                <>0 cycles · launch pending</>
              )}
            </div>
          </Card>
        ))}

        {/* launch card */}
        <button
          onClick={() => openModal("launch")}
          className="flex min-h-[9rem] flex-col items-center justify-center gap-2 rounded border border-dashed border-line-strong px-4 py-3.5 text-muted transition hover:border-accent hover:text-accent active:translate-y-px"
        >
          <Plus size={18} />
          <span className="text-xs font-bold lowercase">+ launch your flywheel</span>
          <span className="text-3xs text-faint">claim a slot · configure · deploy</span>
        </button>
      </div>
      {cards.length === 0 ? (
        <p className="mt-3 text-center text-2xs text-faint">no flywheels match “{q}”</p>
      ) : null}
    </section>
  );
}
