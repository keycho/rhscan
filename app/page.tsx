import { Container } from "@/components/primitives";
import { SearchBox } from "@/components/SearchBox";
import { StatsCard } from "@/components/StatsCard";
import { LiveHead } from "@/components/LiveHead";
import { latestBlocks, latestTransactions } from "@/src/web/lists";
import { getEthMarket } from "@/src/web/price";
import { loadWatermarks, loadNetworkStats, loadTxPerDay } from "@/src/web/cache";

// db-backed: render at request time so `next build` runs no query (static
// generation would hit the transaction pooler and time out). the head lists
// still poll /api/head client-side to follow the chain live.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  // every read degrades to a safe empty value: a transient pooler hiccup should
  // render the page with a blank section, never 500 the whole route.
  const [eth, stats, blocks, txns, chart, wm] = await Promise.all([
    getEthMarket().catch(() => ({ usd: null, change24h: null, marketCap: null })),
    loadNetworkStats().catch(() => ({
      head: null,
      latestBlockTime: null,
      txCountEstimate: 0,
      tps: null,
      medianBaseFeeWei: null,
    })),
    latestBlocks(12).catch(() => []),
    latestTransactions(12).catch(() => []),
    loadTxPerDay().catch(() => ({ granularity: "hour" as const, buckets: [] })),
    loadWatermarks().catch(() => ({
      head: null,
      headUpdatedAt: null,
      backfillFloor: null,
      windowFloor: null,
    })),
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
        <StatsCard eth={eth} stats={stats} watermarks={wm} chart={chart} />
        <LiveHead initial={{ blocks, txns }} />
      </Container>
    </div>
  );
}
