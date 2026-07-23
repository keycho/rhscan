"use client";

import { Card } from "@/components/ui";

const STEPS = [
  {
    num: "01 / Connect",
    body: "Connect the wallet that created the token on Pump.fun.",
    footer: "> verify creator wallet · detect eligible token",
  },
  {
    num: "02 / Configure",
    body: "Choose how claimed creator rewards will be split between liquidity, burns, holder rewards and treasury.",
    footer: "> set routing weights · save configuration",
  },
  {
    num: "03 / Claim & Route",
    body: "Claim creator rewards from Pump.fun, then deposit them into the flywheel to execute the next cycle.",
    footer: "> claimed rewards in · token momentum out",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-page px-4 pb-12">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-text">
        HOW IT WORKS — THE LOOP NEVER STOPS.
      </h2>
      <div className="grid gap-2.5 md:grid-cols-3">
        {STEPS.map((s) => (
          <Card key={s.num} className="flex flex-col px-4 py-3.5">
            <p className="text-sm font-bold text-accent">{s.num}</p>
            <p className="mt-2 flex-1 text-xs leading-5 text-secondary">{s.body}</p>
            <p className="mt-3 text-2xs text-accent/80">{s.footer}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
