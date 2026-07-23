"use client";

import { PofProvider, usePof } from "@/lib/store";
import { TopNav } from "@/components/top-nav";
import { Tickers } from "@/components/tickers";
import { Hero } from "@/components/hero";
import { FeaturedFlywheel } from "@/components/featured-flywheel";
import { StatsRow } from "@/components/stats-row";
import { HowItWorks } from "@/components/how-it-works";
import { AllocationBar } from "@/components/allocation-bar";
import { FlywheelsGrid } from "@/components/flywheels-grid";
import { RecentCycles } from "@/components/recent-cycles";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/toaster";
import { SignInModal } from "@/components/modals/sign-in-modal";
import { WalletModal } from "@/components/modals/wallet-modal";
import { DeployModal } from "@/components/modals/deploy-modal";
import { LaunchModal } from "@/components/modals/launch-modal";

function Modals() {
  const { modal } = usePof();
  if (modal === "signin") return <SignInModal />;
  if (modal === "wallet") return <WalletModal />;
  if (modal === "deploy") return <DeployModal />;
  if (modal === "launch") return <LaunchModal />;
  return null;
}

export default function Page() {
  return (
    <PofProvider>
      <TopNav />
      <Tickers />
      <main>
        <Hero />
        <FeaturedFlywheel />
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
  );
}
