"use client";

import {
  Activity,
  Flame,
  Gauge,
  HeartPulse,
  Hash,
  RefreshCw,
  Coins,
  Vault,
} from "lucide-react";
import { usePof } from "@/lib/store";
import { MetricCard, TextMetricCard } from "@/components/metric-card";
import { SectionHead, Pill, LiveDot } from "@/components/ui";

export function EngineSummary() {
  const { speed, epoch, totalCycles } = usePof();
  return (
    <section className="mx-auto max-w-page px-4 pt-8">
      <SectionHead
        index="01"
        title="engine summary"
        right={
          <Pill tone="green">
            <LiveDot /> streaming
          </Pill>
        }
      />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
        <MetricCard label="flywheel speed" value={speed} suffix="%" icon={Gauge} accent />
        <MetricCard label="epoch" value={epoch} prefix="#" icon={Hash} />
        <TextMetricCard label="reserve balance" value="—" icon={Vault} sub="publishes on-chain at launch" tone="neutral" />
        <MetricCard label="tokens routed" value={12.4} suffix="M" decimals={1} icon={Coins} sub="$POF routed to date" />
        <MetricCard label="burned supply" value={3.42} suffix="M" decimals={2} icon={Flame} sub="perma-locked" subTone="amber" />
        <MetricCard label="momentum score" value={87} icon={Activity} sub="strong" subTone="green" />
        <MetricCard label="total cycles" value={totalCycles} icon={RefreshCw} sub="zero missed" subTone="green" />
        <TextMetricCard label="health status" value="Strong" icon={HeartPulse} sub="all systems turning" />
      </div>
    </section>
  );
}
