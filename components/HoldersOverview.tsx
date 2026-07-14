// the holders-overview card: three concentration stat tiles (top-100, top-50, and
// the gini index in amber as an honesty signal), then a holder-concentration
// donut with a legend and a size-tier distribution. all figures are derived from
// the indexed top-holder balances; when we do not hold every holder, an honesty
// note states which figures cover only the analysed top-N.

import type { HolderAnalytics } from "@/src/web/holder-analytics";
import { formatNumber } from "@/src/web/format";
import { Donut } from "@/components/Donut";
import { AmberTag, HonestyLine } from "@/components/honesty";

const pct2 = (n: number | null) => (n == null ? "—" : `${n.toFixed(2)}%`);
const pct1 = (n: number) => `${n.toFixed(1)}%`;

function Tile({
  label,
  value,
  valueClass = "text-text",
  sub,
  labelExtra,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: React.ReactNode;
  labelExtra?: React.ReactNode;
}) {
  return (
    <div className="border-border-hair px-[18px] py-4 [&:not(:last-child)]:border-b sm:[&:not(:last-child)]:border-b-0 sm:[&:not(:last-child)]:border-r">
      <div className="mono mb-[7px] flex items-center gap-[6px] text-[10px] tracking-[0.05em] text-label">
        <span>{label}</span>
        {labelExtra}
      </div>
      <div className={`mono text-[26px] font-semibold tracking-[-0.02em] ${valueClass}`}>{value}</div>
      {sub && <div className="mono mt-[5px] text-[11px] text-label">{sub}</div>}
    </div>
  );
}

export function HoldersOverview({
  analytics,
  holderCount,
}: {
  analytics: HolderAnalytics;
  holderCount: number | null;
}) {
  const a = analytics;

  return (
    <section className="mb-[14px] overflow-hidden rounded-lg border border-border-strong bg-surface">
      <div className="border-b border-border-hair px-4 py-[13px] text-[14px] font-semibold text-text">
        holders overview
      </div>

      {/* stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3">
        <Tile
          label="TOP 100 CONCENTRATION"
          value={pct2(a.top100)}
          sub={
            <>
              top 5 <span className="text-text">{pct2(a.top5)}</span> · top 10{" "}
              <span className="text-text">{pct2(a.top10)}</span>
            </>
          }
        />
        <Tile
          label="TOP 50 CONCENTRATION"
          value={pct2(a.top50)}
          sub={
            <>
              top 25 <span className="text-text">{pct2(a.top25)}</span>
            </>
          }
        />
        <Tile
          label="GINI INDEX"
          labelExtra={!a.exact ? <AmberTag>top {a.analysed}</AmberTag> : undefined}
          value={a.gini != null ? a.gini.toFixed(3) : "—"}
          valueClass="text-amber"
          sub={<span className="text-amber">{a.giniLabel}</span>}
        />
      </div>

      {/* donut + tiers */}
      <div className="grid grid-cols-1 border-t border-border-hair lg:grid-cols-2">
        <div className="border-border-hair p-[18px] lg:border-r">
          <div className="mb-[14px] text-[12px] text-label">holder concentration</div>
          <div className="flex items-center gap-5">
            <Donut segments={a.concentration} />
            <div className="grid flex-1 grid-cols-1 gap-x-[18px] gap-y-[6px] sm:grid-cols-2">
              {a.concentration.map((c) => (
                <div key={c.label} className="flex items-center justify-between gap-[10px]">
                  <span className="flex items-center gap-[7px] text-[11.5px] text-tertiary">
                    <span
                      className="h-2 w-2 flex-none rounded-full"
                      style={{ background: c.color }}
                    />
                    {c.label}
                  </span>
                  <span className="mono text-[11.5px] text-text">{pct1(c.pct)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-[18px]">
          <div className="mb-[14px] text-[12px] text-label">tier distribution</div>
          {a.tiers.map((t) => (
            <div key={t.label} className="mb-[9px] flex items-center gap-[10px]">
              <span className="w-16 flex-none text-[12px] text-tertiary" title={`${t.count} holders`}>
                {t.emoji} {t.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-[5px] bg-border-hair">
                <div className="h-full rounded-[5px] bg-green" style={{ width: `${t.pct}%` }} />
              </div>
              <span className="mono w-[52px] flex-none text-right text-[11.5px] text-text">
                {pct1(t.pct)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!a.exact && (
        <div className="border-t border-border-hair bg-subtle px-4 py-2">
          <HonestyLine>
            gini index and tier distribution cover the top {formatNumber(a.analysed)} of{" "}
            {holderCount != null ? formatNumber(holderCount) : "all"} indexed holders; concentration
            percentages are exact.
          </HonestyLine>
        </div>
      )}
    </section>
  );
}
