"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { usePof } from "@/lib/store";
import { X_URL } from "@/data/mock-data";
import { btn } from "@/components/ui";

export function Hero() {
  const { openModal } = usePof();
  const { connected } = useWallet();
  return (
    <section className="px-4 pb-14 pt-16 text-center sm:pt-20">
      <h1 className="title-shadow text-5xl font-extrabold lowercase tracking-tight text-accent sm:text-6xl">
        proof of flywheel
      </h1>
      <p className="mt-5 text-sm italic text-secondary">
        fund the wheel. route the SOL. strengthen the token.
      </p>
      <p className="mt-6 text-sm font-bold text-amber">
        [ connect. configure. deposit SOL. turn the wheel. ]
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => openModal(connected ? "activate" : "wallet")}
          className={btn.solid}
        >
          {connected ? "activate a flywheel" : "connect creator wallet"}
        </button>
        <a href="#flywheels" className={btn.outline}>
          view live flywheels
        </a>
        <a href={X_URL} target="_blank" rel="noopener noreferrer" className={btn.outline}>
          follow on x
        </a>
      </div>
    </section>
  );
}
