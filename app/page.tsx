import { StatBar } from "@/components/StatBar";
import { LiveHead } from "@/components/LiveHead";
import { TxChart } from "@/components/TxChart";
import { SearchBox } from "@/components/SearchBox";
import { Panel } from "@/components/primitives";
import { getNetworkStats, txPerDay } from "@/src/web/stats";
import { latestBlocks, latestTransactions } from "@/src/web/lists";
import { getEthUsd } from "@/src/web/price";

// head-adjacent: short revalidation. the head lists then poll /api/head client
// side to follow the chain between revalidations.
export const revalidate = 5;

export default async function Home() {
  const [stats, ethUsd, blocks, txns, chart] = await Promise.all([
    getNetworkStats(),
    getEthUsd(),
    latestBlocks(12),
    latestTransactions(12),
    txPerDay(14),
  ]);

  return (
    <div className="space-y-5">
      <div className="mx-auto max-w-3xl">
        <SearchBox big />
      </div>

      <StatBar stats={stats} ethUsd={ethUsd} />

      <LiveHead initial={{ blocks, txns }} />

      <Panel title="transactions per day">
        <div className="p-4">
          <TxChart buckets={chart} days={14} />
        </div>
      </Panel>
    </div>
  );
}
