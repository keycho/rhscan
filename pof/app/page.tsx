"use client";

import { PofProvider, usePof } from "@/lib/store";
import { SolanaProvider } from "@/components/solana-provider";
import { TopNav } from "@/components/top-nav";
import { Tickers } from "@/components/tickers";
import { Hero } from "@/components/hero";
import { FeaturedFlywheel } from "@/components/featured-flywheel";
import { CycleAction } from "@/components/cycle-action";
import { StatsRow } from "@/components/stats-row";
import { HowItWorks } from "@/components/how-it-works";
import { AllocationBar } from "@/components/allocation-bar";
import { FlywheelsGrid } from "@/components/flywheels-grid";
import { RecentCycles } from "@/components/recent-cycles";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/toaster";
import { WalletModal } from "@/components/modals/wallet-modal";
import { ActivationModal } from "@/components/modals/activation-modal";

function Modals() {
  const { modal } = usePof();
  if (modal === "wallet") return <WalletModal />;
  if (modal === "activate") return <ActivationModal />;
  return null;
}

export default function Page() {
  return (
    <SolanaProvider>
      <PofProvider>
      <TopNav />
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
        <SiteFooter />
        <Modals />
        <Toaster />
      </PofProvider>
    </SolanaProvider>
  );
}
