"use client";

import { usePof } from "@/lib/store";
import { btn } from "@/components/ui";

export function Hero() {
  const { openModal, toast } = usePof();
  return (
    <section className="px-4 pb-14 pt-16 text-center sm:pt-20">
      <h1 className="title-shadow text-5xl font-extrabold lowercase tracking-tight text-accent sm:text-6xl">
        proof of flywheel
      </h1>
      <p className="mt-5 text-sm italic text-secondary">
        launch the loop. route the fees. keep it turning.
      </p>
      <p className="mt-6 text-sm font-bold text-amber">
        [ fees in. liquidity grows. supply burns. holders earn. ]
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button onClick={() => openModal("launch")} className={btn.solid}>
          launch a flywheel
        </button>
        <a href="#flywheels" className={btn.outline}>
          explore flywheels
        </a>
        <button onClick={() => toast("follow on x — demo link", "info")} className={btn.outline}>
          follow on x
        </button>
      </div>
    </section>
  );
}
