"use client";

import { usePof } from "@/lib/store";
import { GENESIS } from "@/data/mock-data";
import { fmt } from "@/lib/format";
import { Card } from "@/components/ui";
import { useCountUp } from "@/lib/use-count-up";

export function StatsRow() {
  const { feesRouted, totalCycles } = usePof();
  const routed = useCountUp(feesRouted);
  const cycles = useCountUp(totalCycles);

  const stats = [
    { value: `${fmt(routed, 2)} SOL`, label: "claimed rewards routed" },
    { value: fmt(cycles), label: "completed cycles" },
    { value: GENESIS.burnedSupply, label: "tokens burned" },
    { value: "1", label: "live flywheel" },
    { value: "9", label: "open slots" },
  ];

  return (
    <section className="mx-auto max-w-page px-4 pb-12">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="px-3 py-3.5 text-center">
            <p className="text-base font-bold tabular-nums text-accent">{s.value}</p>
            <p className="mt-1 text-3xs text-muted">{s.label}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
