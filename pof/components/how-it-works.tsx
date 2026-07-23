"use client";

import { Card } from "@/components/ui";

const STEPS = [
  {
    num: "01 / Connect",
    body: "Connect the wallet that created the Pump.fun token.",
    footer: "> verify creator wallet · detect eligible token",
  },
  {
    num: "02 / Configure",
    body: "Choose how deposited SOL will be routed through the token economy.",
    footer: "> set routing weights · preview cycle",
  },
  {
    num: "03 / Fund & Execute",
    body: "Deposit SOL into the flywheel and execute the routing cycle.",
    footer: "> deposited SOL in · token momentum out",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-page px-4 pb-12">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-text">
        HOW IT WORKS — FUND. ROUTE. TURN.
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
