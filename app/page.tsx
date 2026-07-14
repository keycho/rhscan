import { Container } from "@/components/primitives";
import { SearchBox } from "@/components/SearchBox";
import { StatsCard } from "@/components/StatsCard";
import { LiveHead } from "@/components/LiveHead";
import { getNetworkStats, txPerDay } from "@/src/web/stats";
import { latestBlocks, latestTransactions } from "@/src/web/lists";
import { getEthMarket } from "@/src/web/price";
import { loadWatermarks } from "@/src/web/cache";

// db-backed: render at request time so `next build` runs no query (static
// generation would hit the transaction pooler and time out). the head lists
// still poll /api/head client-side to follow the chain live.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const [eth, stats, blocks, txns, chart, wm] = await Promise.all([
    getEthMarket(),
    getNetworkStats(),
    latestBlocks(12),
    latestTransactions(12),
    txPerDay(14),
    loadWatermarks(),
  ]);

  return (
    <div>
      {/* flat forest masthead */}
      <div className="relative overflow-hidden border-b-2 border-green bg-masthead">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "15px 15px",
          }}
        />
        <Container className="relative pb-[90px] pt-[30px]">
          <div className="mono mb-[10px] text-[11.5px] uppercase tracking-[0.1em] text-green-dim">
            orbit l2 · arbitrum
          </div>
          <div className="mb-5 text-[23px] font-semibold tracking-[-0.02em] text-[#f4f5f2]">
            robinhood chain explorer
          </div>
          <div className="max-w-[820px]">
            <SearchBox big />
          </div>
        </Container>
      </div>

      <Container className="pb-8">
        <StatsCard eth={eth} stats={stats} watermarks={wm} buckets={chart} />
        <LiveHead initial={{ blocks, txns }} />
      </Container>
    </div>
  );
}
