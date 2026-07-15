// the holders-overview card: five top-N concentration stat tiles, a gini-index
// tile with a plain-language label, a holder-concentration donut, and a size-tier
// distribution whose bars are each tier's share of the basis. all figures are
// derived from the indexed top-holder balances — no external calls. when total
// supply is unresolved the basis falls back to the sum of the indexed balances
// and every figure is labelled "of indexed balances" instead of "of supply"; an
// honesty strip states what is exact vs approximate.

import type { HolderAnalytics } from "@/src/web/holder-analytics";
import { formatNumber } from "@/src/web/format";
import { Donut } from "@/components/Donut";
import { AmberTag, HonestyLine } from "@/components/honesty";

const pct2 = (n: number | null) => (n == null ? "—" : `${n.toFixed(2)}%`);
const pct1 = (n: number) => `${n.toFixed(n < 0.1 && n > 0 ? 3 : 1)}%`;

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
    <div className="border-border-hair px-[16px] py-[15px] [&:not(:last-child)]:border-b sm:[&:not(:last-child)]:border-b-0 sm:[&:not(:last-child)]:border-r">
      <div className="mono mb-[7px] flex items-center gap-[6px] text-[10px] tracking-[0.05em] text-label">
        <span>{label}</span>
        {labelExtra}
      </div>
      <div className={`mono text-[22px] font-semibold tracking-[-0.02em] ${valueClass}`}>{value}</div>
      {sub && <div className="mono mt-[5px] text-[10.5px] text-label">{sub}</div>}
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
  const basis = a.basisLabel; // "supply" | "indexed balances"
  const ofBasis = `of ${basis}`;

  const conc: { n: number; v: number | null }[] = [
    { n: 5, v: a.top5 },
    { n: 10, v: a.top10 },
    { n: 25, v: a.top25 },
    { n: 50, v: a.top50 },
    { n: 100, v: a.top100 },
  ];

  return (
    <section className="mb-[14px] overflow-hidden rounded-lg border border-border-strong bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-hair px-4 py-[13px]">
        <span className="text-[14px] font-semibold text-text">holders overview</span>
        <span className="mono text-[10.5px] text-label">
          {a.supplyKnown ? "shares of total supply" : "supply unresolved · shares of indexed balances"}
        </span>
      </div>

      {/* concentration stat tiles — top 5 / 10 / 25 / 50 / 100 */}
      <div className="grid grid-cols-1 sm:grid-cols-5">
        {conc.map((c) => (
          <Tile key={c.n} label={`TOP ${c.n}`} value={pct2(c.v)} sub={ofBasis} />
        ))}
      </div>

      {/* gini index */}
      <div className="grid grid-cols-1 border-t border-border-hair sm:grid-cols-[1fr_2fr]">
        <Tile
          label="GINI INDEX"
          labelExtra={!a.exact ? <AmberTag>top {formatNumber(a.analysed)}</AmberTag> : undefined}
          value={a.gini != null ? a.gini.toFixed(3) : "—"}
          valueClass="text-amber"
          sub={<span className="text-amber">{a.giniLabel}</span>}
        />
        <div className="flex items-center border-t border-border-hair px-4 py-[15px] text-[11.5px] leading-relaxed text-label sm:border-l sm:border-t-0">
          0 is a perfectly equal distribution, 1 is one holder owning everything.
          {" "}
          {a.exact
            ? "computed over every indexed holder."
            : `computed over the top ${formatNumber(a.analysed)} holders we index, so it approximates the full distribution.`}
        </div>
      </div>

      {/* donut + tier distribution */}
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
          <div className="mb-[4px] text-[12px] text-label">tier distribution</div>
          <div className="mb-[14px] text-[10.5px] text-label">
            each bar is the tier&apos;s share {ofBasis}; holders bucketed by their own share.
          </div>
          {a.tiers.map((t) => (
            <div key={t.label} className="mb-[9px] flex items-center gap-[10px]">
              <span
                className="w-[124px] flex-none text-[12px] text-tertiary"
                title={`${formatNumber(t.count)} holder${t.count === 1 ? "" : "s"} · ${t.threshold} ${ofBasis}`}
              >
                {t.emoji} {t.label}
                <span className="mono ml-[5px] text-[10px] text-label">{formatNumber(t.count)}</span>
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-[5px] bg-border-hair">
                <div className="h-full rounded-[5px] bg-green" style={{ width: `${Math.min(100, t.pct)}%` }} />
              </div>
              <span className="mono w-[56px] flex-none text-right text-[11.5px] text-text">
                {pct1(t.pct)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border-hair bg-subtle px-4 py-2">
        <HonestyLine>
          {a.supplyKnown
            ? "top-n concentration and the donut are exact shares of total supply; "
            : "total supply is unresolved, so every figure is a share of the indexed holder balances, not of supply; "}
          {a.exact
            ? "all indexed holders are included."
            : `holders are ranked by balance, so the larger tiers are complete — the gini index and the smallest tiers cover only the top ${formatNumber(a.analysed)}${
                holderCount != null ? ` of ${formatNumber(holderCount)}` : ""
              } indexed holders.`}
        </HonestyLine>
      </div>
    </section>
  );
}
