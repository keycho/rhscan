// the home stats strip. dense, monospace figures, no chrome. the transaction
// total is a planner estimate (it avoids a full count over the partitioned
// transactions table) and is labelled "est".

import { formatGwei, formatNumber, formatUsd } from "@/src/web/format";
import type { NetworkStats } from "@/src/web/stats";

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="border-border px-4 py-3 [&:not(:last-child)]:border-b sm:border-b-0 sm:[&:not(:last-child)]:border-r">
      <div className="text-2xs uppercase tracking-wide text-faint">{label}</div>
      <div className="mono mt-0.5 text-[15px] font-semibold text-text">{value}</div>
      {sub ? <div className="text-2xs text-faint">{sub}</div> : null}
    </div>
  );
}

export function StatBar({ stats, ethUsd }: { stats: NetworkStats; ethUsd: number | null }) {
  return (
    <div className="grid grid-cols-1 rounded border border-border bg-panel sm:grid-cols-2 lg:grid-cols-5">
      <Stat
        label="latest block"
        value={stats.head != null ? formatNumber(stats.head) : "-"}
      />
      <Stat
        label="txns indexed"
        value={formatNumber(stats.txCountEstimate)}
        sub="est (window)"
      />
      <Stat
        label="tps"
        value={stats.tps != null ? stats.tps.toFixed(1) : "-"}
        sub="recent blocks"
      />
      <Stat
        label="median gas"
        value={
          stats.medianBaseFeeWei != null ? `${formatGwei(stats.medianBaseFeeWei)} gwei` : "-"
        }
        sub="base fee"
      />
      <Stat
        label="eth price"
        value={ethUsd != null ? formatUsd(ethUsd) : "-"}
        sub={ethUsd != null ? "coingecko, 60s" : "unavailable"}
      />
    </div>
  );
}
