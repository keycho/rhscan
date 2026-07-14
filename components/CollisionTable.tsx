// the disambiguation surface. one row per contract that shares a searched name or
// symbol, ranked by activity, showing the facts a reader needs to tell real from
// impostor: deployment time, deployer, holders, transfers, and top-10
// concentration. no scores, no risk labels, no "this looks like a rug". the
// numbers, and the reader decides.

import Link from "next/link";
import { AddrLink } from "@/components/links";
import { Empty, ScrollX } from "@/components/primitives";
import { TimeAgo } from "@/components/TimeAgo";
import { formatNumber, formatShare, shortAddr } from "@/src/web/format";
import type { TokenCard } from "@/src/web/tokens-web";

export function CollisionTable({ tokens }: { tokens: TokenCard[] }) {
  if (tokens.length === 0) return <Empty>no matching tokens.</Empty>;
  return (
    <ScrollX>
      <table className="w-full min-w-[820px] text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-faint">
            <th className="px-4 py-2 font-medium">token</th>
            <th className="px-4 py-2 font-medium">contract</th>
            <th className="px-4 py-2 font-medium">deployed</th>
            <th className="px-4 py-2 font-medium">deployer</th>
            <th className="px-4 py-2 text-right font-medium">holders</th>
            <th className="px-4 py-2 text-right font-medium">transfers</th>
            <th className="px-4 py-2 text-right font-medium">top 10</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.address} className="border-b border-border/60 hover:bg-panel2/60">
              <td className="px-4 py-2.5">
                <Link href={`/token/${t.address}`} className="font-medium text-text hover:text-accent">
                  {t.name ?? "unnamed"}
                </Link>
                {t.symbol && <span className="ml-1.5 text-muted">{t.symbol}</span>}
              </td>
              <td className="px-4 py-2.5">
                <Link href={`/token/${t.address}`} className="mono text-accent" title={t.address}>
                  {shortAddr(t.address)}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-muted">
                {t.creationTime ? (
                  <TimeAgo iso={t.creationTime} />
                ) : t.creationBlock != null ? (
                  <span className="mono">blk {formatNumber(t.creationBlock)}</span>
                ) : (
                  <span className="text-faint">unknown</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                {t.deployer ? <AddrLink address={t.deployer} /> : <span className="text-faint">-</span>}
              </td>
              <td className="px-4 py-2.5 text-right mono">
                {t.holderCount != null ? formatNumber(t.holderCount) : "-"}
              </td>
              <td className="px-4 py-2.5 text-right mono">
                {t.transferCount != null ? formatNumber(t.transferCount) : "-"}
              </td>
              <td className="px-4 py-2.5 text-right mono">{formatShare(t.top10Share)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollX>
  );
}
