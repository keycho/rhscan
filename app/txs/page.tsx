import type { Metadata } from "next";
import { Container, Panel, ScrollX } from "@/components/primitives";
import { AddrLink, BlockLink, TxLink } from "@/components/links";
import { MethodBadge, StatusBadge } from "@/components/badges";
import { TimeAgo } from "@/components/TimeAgo";
import { HonestyLine } from "@/components/honesty";
import { latestTransactions } from "@/src/web/lists";
import { loadWatermarks } from "@/src/web/cache";
import { formatEth, formatNumber } from "@/src/web/format";

export const revalidate = 5;

export const metadata: Metadata = {
  title: "transactions",
  description: "latest transactions on robinhood chain, from the indexed window.",
};

export default async function TxnsPage() {
  const [txns, wm] = await Promise.all([latestTransactions(50), loadWatermarks()]);
  const range =
    wm.head != null
      ? `blocks ${wm.windowFloor != null ? formatNumber(wm.windowFloor) : "?"} → ${formatNumber(wm.head)}`
      : "";

  return (
    <Container className="space-y-[14px] pb-8 pt-6">
      <div className="flex flex-wrap items-baseline gap-[10px]">
        <h1 className="text-[20px] font-semibold tracking-[-0.02em]">latest transactions</h1>
        <span className="mono text-[11.5px] text-label">chain 4663 · orbit l2</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-y border-border-footer py-2">
        <HonestyLine right={range}>
          latest 50 transactions from the head of the indexed window.
        </HonestyLine>
      </div>

      <Panel>
        <ScrollX>
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="border-b border-border-strong bg-subtle text-left text-[10.5px] uppercase tracking-[0.03em] text-label">
                <th className="px-4 py-[9px] font-medium">tx hash</th>
                <th className="px-4 py-[9px] font-medium">block</th>
                <th className="px-4 py-[9px] font-medium">age</th>
                <th className="px-4 py-[9px] font-medium">method</th>
                <th className="px-4 py-[9px] font-medium">from</th>
                <th className="px-4 py-[9px] font-medium">to</th>
                <th className="px-4 py-[9px] text-right font-medium">value</th>
                <th className="px-4 py-[9px] font-medium">status</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.hash} className="border-b border-border-hair hover:bg-hover">
                  <td className="px-4 py-[11px]">
                    <TxLink hash={t.hash} />
                  </td>
                  <td className="px-4 py-[11px]">
                    <BlockLink number={t.blockNumber} />
                  </td>
                  <td className="px-4 py-[11px] text-[12px] text-muted">
                    <TimeAgo iso={t.blockTimestamp} />
                  </td>
                  <td className="px-4 py-[11px]">
                    <MethodBadge methodId={t.methodId} />
                  </td>
                  <td className="px-4 py-[11px]">
                    <AddrLink address={t.from} />
                  </td>
                  <td className="px-4 py-[11px]">
                    {t.to ? (
                      <AddrLink address={t.to} />
                    ) : (
                      <span className="text-2xs text-tertiary">contract creation</span>
                    )}
                  </td>
                  <td className="mono px-4 py-[11px] text-right text-secondary">
                    {formatEth(t.value, 5)}
                  </td>
                  <td className="px-4 py-[11px]">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollX>
      </Panel>
    </Container>
  );
}
