// the token tracker table: one row per contract, the whole row a link to the
// token page. this chain has no price feed for its memecoins, so the design's
// price / change / volume / market-cap columns are replaced with the real signals
// the index does carry — holders, transfer activity, top-10 concentration, and
// deployment age. the honesty point of view (ranked by real activity, no
// sponsored placements) is preserved exactly.

import Link from "next/link";
import { TokenAvatar } from "@/components/TokenAvatar";
import { TimeAgo } from "@/components/TimeAgo";
import { Empty, ScrollX } from "@/components/primitives";
import { formatNumber, formatShare } from "@/src/web/format";
import type { TokenCard } from "@/src/web/tokens-web";

const COLS = "grid-cols-[48px_minmax(0,1fr)_110px_130px_100px_130px]";

function Transfers({ t }: { t: TokenCard }) {
  if (t.transferCount != null) return <>{formatNumber(t.transferCount)}</>;
  if (t.windowedTransfers != null && t.windowedTransfers > 0) {
    return (
      <span title="transfers seen in the indexed window (all-time not yet hydrated)">
        {formatNumber(t.windowedTransfers)}
        <span className="ml-0.5 text-muted">·win</span>
      </span>
    );
  }
  return <span className="text-muted">—</span>;
}

export function TokenTable({ tokens, startRank = 1 }: { tokens: TokenCard[]; startRank?: number }) {
  if (tokens.length === 0) return <Empty>no tokens indexed.</Empty>;

  return (
    <ScrollX>
      <div className="min-w-[720px]">
        <div
          className={`grid ${COLS} border-b border-border-strong bg-subtle px-4 py-2 text-[10.5px] uppercase tracking-[0.03em] text-label`}
        >
          <span>#</span>
          <span>token</span>
          <span className="text-right">holders</span>
          <span className="text-right">transfers</span>
          <span className="text-right">top 10</span>
          <span className="text-right">deployed</span>
        </div>

        {tokens.map((t, i) => (
          <Link
            key={t.address}
            href={`/token/${t.address}`}
            className={`grid ${COLS} items-center border-b border-border-hair px-4 py-[11px] no-underline transition-colors hover:bg-hover hover:no-underline`}
          >
            <span className="mono text-[12px] text-muted">{startRank + i}</span>
            <div className="flex min-w-0 items-center gap-[11px]">
              <TokenAvatar address={t.address} symbol={t.symbol} name={t.name} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-text">
                  {t.name ?? "unnamed"}
                  {t.symbol && <span className="mono ml-1.5 text-[11px] text-muted">{t.symbol}</span>}
                </div>
              </div>
            </div>
            <span className="mono text-right text-[12px] text-secondary">
              {t.holderCount != null ? formatNumber(t.holderCount) : <span className="text-muted">—</span>}
            </span>
            <span className="mono text-right text-[12px] text-secondary">
              <Transfers t={t} />
            </span>
            <span className="mono text-right text-[12px] text-secondary">
              {t.top10Share != null ? formatShare(t.top10Share) : <span className="text-muted">—</span>}
            </span>
            <span className="mono text-right text-[12px] text-label">
              {t.creationTime ? (
                <TimeAgo iso={t.creationTime} />
              ) : t.creationBlock != null ? (
                <>blk {formatNumber(t.creationBlock)}</>
              ) : (
                <span className="text-muted">—</span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </ScrollX>
  );
}
