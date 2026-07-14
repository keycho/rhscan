// token holders ranked by balance, with each holder's share of supply. when the
// balance-drift check flagged the token, the rows whose replayed balance
// disagrees with live balanceOf are marked inline, so a reader never takes a
// quietly-wrong number at face value.

import { AddrLink } from "@/components/links";
import { Empty, Pill, ScrollX } from "@/components/primitives";
import { formatNumber, formatUnits, isZeroAddress } from "@/src/web/format";
import type { Holder } from "@/src/holders";
import type { DriftReport } from "@/src/web/drift";

// balance / total as a percentage string, exact via bigint.
function share(balance: string, total: string | null): string {
  if (!total) return "-";
  const t = BigInt(total);
  if (t <= 0n) return "-";
  const bps = (BigInt(balance) * 1_000_000n) / t; // millionths
  const pct = Number(bps) / 10_000;
  return `${pct.toFixed(pct < 0.01 ? 4 : 2)}%`;
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

  return (
    <ScrollX>
      <table className="w-full min-w-[720px] text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-faint">
            <th className="px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">holder</th>
            <th className="px-4 py-2 text-right font-medium">balance</th>
            <th className="px-4 py-2 text-right font-medium">share</th>
            <th className="px-4 py-2 font-medium">check</th>
          </tr>
        </thead>
        <tbody>
          {holders.map((h, i) => {
            const d = drift.byHolder[h.holderAddress.toLowerCase()];
            const mismatch = d && d.onchain != null && !d.match;
            return (
              <tr
                key={h.holderAddress}
                className={`border-b border-border/60 hover:bg-panel2/60 ${
                  mismatch ? "bg-warn/5" : ""
                }`}
              >
                <td className="px-4 py-2.5 text-faint mono">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <AddrLink address={h.holderAddress} short={false} />
                  {isZeroAddress(h.holderAddress) && (
                    <span className="ml-2 text-2xs text-faint">(zero address)</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right mono">
                  {formatUnits(h.balance, dp, 6)}
                </td>
                <td className="px-4 py-2.5 text-right mono text-muted">
                  {share(h.balance, totalSupply)}
                </td>
                <td className="px-4 py-2.5">
                  {mismatch ? (
                    <Pill
                      tone="warn"
                      title={`indexed ${d!.indexed}, on-chain ${d!.onchain}`}
                    >
                      differs on-chain
                    </Pill>
                  ) : d && d.match ? (
                    <span className="text-2xs text-ok">ok</span>
                  ) : (
                    <span className="text-2xs text-faint">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {drift.checked > 0 && (
        <p className="px-4 py-2 text-2xs text-faint">
          on-chain column compares the top {formatNumber(drift.checked)} replayed
          balances against live balanceOf at the hydrated block.
        </p>
      )}
    </ScrollX>
  );
}
