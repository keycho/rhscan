// the home stats card: a white bordered card that overlaps the masthead. four
// columns of dense monospace figures, every window-derived total carrying an
// amber `window` tag, a 14-day tx-history sparkline, and an honesty footer strip
// stating the indexed block range. all figures are real; anything unavailable
// (usd market cap on a coingecko miss, a trend with too few indexed days)
// degrades to a dash rather than a fabricated number.

import { formatGwei, formatNumber, formatUsd } from "@/src/web/format";
import type { NetworkStats } from "@/src/web/stats";
import type { TxChartData } from "@/src/web/stats";
import type { EthMarket } from "@/src/web/price";
import type { Watermarks } from "@/src/web/watermarks";
import { Sparkline } from "@/components/Sparkline";
import { AmberTag, HonestyLine } from "@/components/honesty";
import { TimeAgo } from "@/components/TimeAgo";

function compact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)} B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)} M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)} K`;
  return formatNumber(n);
}

function pct(n: number | null): { text: string; color: string } {
  if (n == null || !Number.isFinite(n)) return { text: "", color: "var(--muted)" };
  const sign = n > 0 ? "+" : "";
  const color = n > 0 ? "var(--green)" : n < 0 ? "var(--negative)" : "var(--muted)";
  return { text: `${sign}${n.toFixed(2)}%`, color };
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mono mb-[6px] text-[10px] tracking-[0.05em] text-label">{children}</div>
);

export function StatsCard({
  eth,
  stats,
  watermarks,
  chart,
}: {
  eth: EthMarket;
  stats: NetworkStats;
  watermarks: Watermarks;
  chart: TxChartData;
}) {
  const change = pct(eth.change24h);

  const series = chart.buckets.map((b) => b.txCount);
  const first = series[0];
  const last = series[series.length - 1];
  const trend =
    series.length >= 2 && first != null && first > 0 && last != null
      ? pct(((last - first) / first) * 100)
      : { text: "", color: "var(--muted)" };
  // label the span by bucket: hourly buckets read "24H" (intraday), daily "ND".
  const chartLabel = chart.granularity === "hour" ? "24H" : `${series.length}D`;

  const head = watermarks.head ?? stats.head;
  const floor = watermarks.windowFloor ?? watermarks.backfillFloor;
  const range =
    head != null
      ? `blocks ${floor != null ? formatNumber(floor) : "?"} → ${formatNumber(head)}`
      : "";

  return (
    <section className="relative z-[2] -mt-16 mb-[14px] overflow-hidden rounded-lg border border-border-strong bg-surface">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.3fr]">
        {/* col 1 — ether price / market cap */}
        <div className="border-border-hair px-[18px] py-4 sm:border-r lg:border-r">
          <Label>ETHER PRICE</Label>
          <div className="mono mb-[14px] text-[16px] font-semibold text-text">
            {eth.usd != null ? formatUsd(eth.usd) : "—"}{" "}
            {change.text && (
              <span className="text-[11px]" style={{ color: change.color }}>
                {change.text}
              </span>
            )}
          </div>
          <Label>MARKET CAP</Label>
          <div className="mono text-[13.5px] text-secondary">
            {eth.marketCap != null ? formatUsd(eth.marketCap, 0) : "—"}
          </div>
        </div>

        {/* col 2 — transactions (window) / med gas */}
        <div className="border-border-hair px-[18px] py-4 lg:border-r">
          <div className="mb-[6px] flex items-center gap-[6px]">
            <span className="mono text-[10px] tracking-[0.05em] text-label">TRANSACTIONS</span>
            <AmberTag>window</AmberTag>
          </div>
          <div className="mono mb-[14px] text-[16px] font-semibold text-text">
            {compact(stats.txCountEstimate)}
          </div>
          <Label>MED GAS</Label>
          <div className="mono text-[13.5px] text-secondary">
            {stats.medianBaseFeeWei != null ? `${formatGwei(stats.medianBaseFeeWei)} gwei` : "—"}
          </div>
        </div>

        {/* col 3 — latest block / tps */}
        <div className="border-border-hair px-[18px] py-4 sm:border-r sm:border-t lg:border-t-0 lg:border-r">
          <Label>LATEST BLOCK</Label>
          <div className="mono text-[16px] font-semibold text-green">
            {head != null ? formatNumber(head) : "—"}
          </div>
          <div className="mono mb-[14px] mt-[2px] text-[10px] text-muted">
            {stats.latestBlockTime ? <TimeAgo iso={stats.latestBlockTime} /> : "—"}
          </div>
          <Label>TPS</Label>
          <div className="mono text-[13.5px] text-secondary">
            {stats.tps != null ? `${stats.tps.toFixed(1)} tps` : "—"}
            <span className="ml-1 text-[10px] text-muted">recent blocks</span>
          </div>
        </div>

        {/* col 4 — tx history sparkline */}
        <div className="border-t border-border-hair px-[18px] py-4 sm:col-span-2 lg:col-span-1 lg:border-t-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="mono text-[10px] tracking-[0.05em] text-label">
              TX HISTORY · {chartLabel}
            </span>
            {trend.text && (
              <span className="mono text-[10px]" style={{ color: trend.color }}>
                {trend.text}
              </span>
            )}
          </div>
          <Sparkline values={series} id="tx-history" unit={chart.granularity} />
        </div>
      </div>

      <div className="border-t border-border-hair bg-subtle px-[18px] py-2">
        <HonestyLine right={range}>
          indexes a rolling ~60k block window, not full history.
        </HonestyLine>
      </div>
    </section>
  );
}
