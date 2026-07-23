"use client";

import { Card } from "@/components/ui";

const STEPS = [
  {
    num: "01 / Launch",
    body: "Connect a wallet, choose a token and configure how incoming fees should be routed.",
    footer: "> deploy engine · one transaction",
  },
  {
    num: "02 / Route",
    body: "Every cycle automatically divides incoming value between liquidity, burns, holders and growth.",
    footer: "> transparent allocations · onchain",
  },
  {
    num: "03 / Turn",
    body: "Each completed cycle strengthens the next one. More activity creates more momentum.",
    footer: "> fees in · momentum out",
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
