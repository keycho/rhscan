// token holders ranked by balance, each with a mini-bar sized against the top
// holder and its exact share of supply. this chain has no price feed for these
// tokens, so the design's usd "value" column is replaced with the balance-drift
// check: when the replay disagrees with live balanceOf the row is flagged, so a
// reader never takes a quietly-wrong number at face value.

import { AddrLink } from "@/components/links";
import { CopyButton } from "@/components/CopyButton";
import { Empty, ScrollX } from "@/components/primitives";
import { formatUnits, isZeroAddress } from "@/src/web/format";
import type { Holder } from "@/src/holders";
import type { DriftReport } from "@/src/web/drift";

// the address holds a full 42-char mono hash that cannot wrap, so its column
// gets an explicit minimum wide enough to fit it (minmax(0,1fr) let the track
// shrink below the address, which then overflowed into the quantity column). the
// table lives in a ScrollX, so narrow viewports scroll rather than overlap.
const COLS = "grid-cols-[48px_minmax(340px,1fr)_180px_190px_76px]";

// balance / total as a percentage number, exact via bigint.
function pctNum(balance: string, total: string | null): number {
  if (!total) return 0;
  const t = BigInt(total);
  if (t <= 0n) return 0;
  return Number((BigInt(balance) * 1_000_000n) / t) / 10_000;
}

function pctText(p: number): string {
  return `${p.toFixed(p < 0.01 ? 4 : 2)}%`;
}

export function HoldersTable({
  holders,
  decimals,
  totalSupply,
  drift,
}: {
  holders: Holder[];
  decimals: number | null;
  totalSupply: string | null;
  drift: DriftReport;
}) {
  if (holders.length === 0) return <Empty>no holders indexed yet.</Empty>;
  const dp = decimals ?? 18;
  const pcts = holders.map((h) => pctNum(h.balance, totalSupply));
  const maxPct = Math.max(1e-9, ...pcts);

  return (
    <ScrollX>
      <div className="min-w-[840px]">
        <div
          className={`grid ${COLS} border-b border-border-strong bg-subtle px-4 py-[9px] text-[10.5px] uppercase tracking-[0.03em] text-label`}
        >
          <span>rank</span>
          <span>address</span>
          <span className="text-right">quantity</span>
          <span className="text-right">percentage</span>
          <span className="text-right">check</span>
        </div>

        {holders.map((h, i) => {
          const p = pcts[i]!;
          const barW = Math.max(3, (p / maxPct) * 100);
          const d = drift.byHolder[h.holderAddress.toLowerCase()];
          const mismatch = d && d.onchain != null && !d.match;
          return (
            <div
              key={h.holderAddress}
              className={`grid ${COLS} items-center border-b border-border-hair px-4 py-[11px] transition-colors hover:bg-hover ${
                mismatch ? "bg-amber/5" : ""
              }`}
            >
              <span className="mono text-[12px] text-muted">{i + 1}</span>
              <span className="flex min-w-0 items-center gap-[7px]">
                <AddrLink address={h.holderAddress} short={false} />
                <CopyButton value={h.holderAddress} />
                {isZeroAddress(h.holderAddress) && (
                  <span className="text-[10px] text-muted">(zero)</span>
                )}
              </span>
              <span className="mono text-right text-[12px] text-secondary">
                {formatUnits(h.balance, dp, 4)}
              </span>
              <span className="flex items-center justify-end gap-[10px]">
                <span className="h-[6px] w-24 overflow-hidden rounded-[4px] bg-border-hair">
                  <span className="block h-full rounded-[4px] bg-green" style={{ width: `${barW}%` }} />
                </span>
                <span className="mono w-16 text-right text-[12px] text-text">{pctText(p)}</span>
              </span>
              <span className="text-right">
                {mismatch ? (
                  <span
                    className="mono text-[10px] text-amber"
                    title={`indexed ${d!.indexed}, on-chain ${d!.onchain}`}
                  >
                    differs
                  </span>
                ) : d && d.match ? (
                  <span className="text-[10px] text-green">ok</span>
                ) : (
                  <span className="text-[10px] text-muted">—</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </ScrollX>
  );
}
