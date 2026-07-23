"use client";

import { PofProvider, usePof } from "@/lib/store";
import { TopNav } from "@/components/top-nav";
import { StatusStrip } from "@/components/status-strip";
import { Hero } from "@/components/hero";
import { EngineSummary } from "@/components/engine-summary";
import { FlywheelGraphic } from "@/components/flywheel-graphic";
import { GenesisPanel } from "@/components/genesis-panel";
import { AllocationPanel } from "@/components/allocation-panel";
import { MomentumPanel } from "@/components/momentum-panel";
import { CycleTable } from "@/components/cycle-table";
import { ActivityFeed } from "@/components/activity-feed";
import { LaunchPanel } from "@/components/launch-panel";
import { MyEngines } from "@/components/my-engines";
import { OpenSlots } from "@/components/open-slots";
import { UtilityGrid } from "@/components/utility-grid";
import { DocsPanel } from "@/components/docs-panel";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/toaster";
import { SignInModal } from "@/components/modals/sign-in-modal";
import { WalletModal } from "@/components/modals/wallet-modal";
import { DeployModal } from "@/components/modals/deploy-modal";
import { SectionHead, Pill } from "@/components/ui";

function Modals() {
  const { modal } = usePof();
  if (modal === "signin") return <SignInModal />;
  if (modal === "wallet") return <WalletModal />;
  if (modal === "deploy") return <DeployModal />;
  return null;
}

export default function Page() {
  return (
    <PofProvider>
      <TopNav />
      <StatusStrip />
      <main>
        <Hero />

        <EngineSummary />

        {/* flywheel + genesis engine */}
        <section id="engine" className="mx-auto max-w-page scroll-mt-16 px-4 pt-10">
          <SectionHead
            index="02"
            title="genesis engine"
            right={<Pill tone="green">engine_001 · $POF</Pill>}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <FlywheelGraphic />
            <GenesisPanel />
          </div>
        </section>

        {/* allocation + momentum */}
        <section className="mx-auto max-w-page px-4 pt-10">
          <SectionHead index="03" title="allocation & momentum" />
          <div className="grid gap-4 xl:grid-cols-2">
            <AllocationPanel />
            <MomentumPanel />
          </div>
        </section>

        {/* cycles + activity */}
        <section id="cycles" className="mx-auto max-w-page scroll-mt-16 px-4 pt-10">
          <SectionHead
            index="04"
            title="cycles & activity"
            right={<span className="font-mono text-3xs text-faint">public transparency layer</span>}
          />
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <CycleTable />
            <ActivityFeed />
          </div>
        </section>

        {/* launch */}
        <section id="launch" className="mx-auto max-w-page scroll-mt-16 px-4 pt-10">
          <SectionHead
            index="05"
            title="launch your flywheel"
            right={<span className="font-mono text-3xs text-faint">launch your engine</span>}
          />
          <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <LaunchPanel />
            <MyEngines />
          </div>
        </section>

        {/* slots */}
        <section className="mx-auto max-w-page px-4 pt-10">
          <SectionHead index="06" title="open launch slots" />
          <OpenSlots />
        </section>

        {/* features */}
        <section className="mx-auto max-w-page px-4 pt-10">
          <SectionHead
            index="07"
            title="why tokens use pof"
            right={<span className="font-mono text-3xs text-faint">reusable by design</span>}
          />
          <UtilityGrid />
        </section>

        {/* docs */}
        <section id="docs" className="mx-auto max-w-page scroll-mt-16 px-4 pt-10">
          <SectionHead index="08" title="docs & integration" />
          <DocsPanel />
        </section>
      </main>

      <SiteFooter />
      <Modals />
      <Toaster />
    </PofProvider>
  );
}
