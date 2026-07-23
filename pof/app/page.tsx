"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { AppShell } from "@/components/app-shell";
import { usePof } from "@/lib/store";
import { Tickers } from "@/components/tickers";
import { Hero } from "@/components/hero";
import { FeaturedFlywheel } from "@/components/featured-flywheel";
import { CycleAction } from "@/components/cycle-action";
import { StatsRow } from "@/components/stats-row";
import { HowItWorks } from "@/components/how-it-works";
import { AllocationBar } from "@/components/allocation-bar";
import { FlywheelsGrid } from "@/components/flywheels-grid";
import { RecentCycles } from "@/components/recent-cycles";

/** opens the wizard when arriving via /?activate=1 (e.g. from the preview page) */
function AutoActivate() {
  const { openModal, setPendingActivate } = usePof();
  const { connected } = useWallet();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("activate") !== "1") return;
    fired.current = true;
    if (connected) {
      openModal("activate");
    } else {
      setPendingActivate(true);
      openModal("wallet");
    }
  }, [connected, openModal, setPendingActivate]);

  return null;
}

export default function Page() {
  return (
    <AppShell>
      <AutoActivate />
      <Tickers />
      <main>
        <Hero />
        <FeaturedFlywheel />
        <CycleAction />
        <StatsRow />
        <HowItWorks />
        <AllocationBar />
        <FlywheelsGrid />
        <RecentCycles />
      </main>
    </AppShell>
  );
}
