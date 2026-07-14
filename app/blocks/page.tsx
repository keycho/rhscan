import type { Metadata } from "next";
import { Container, Panel, ScrollX } from "@/components/primitives";
import { AddrLink, BlockLink } from "@/components/links";
import { TimeAgo } from "@/components/TimeAgo";
import { HonestyLine } from "@/components/honesty";
import { latestBlocks } from "@/src/web/lists";
import { loadWatermarks } from "@/src/web/cache";
import { formatNumber } from "@/src/web/format";

export const revalidate = 5;

export const metadata: Metadata = {
  title: "blocks",
  description: "latest blocks on robinhood chain, from the indexed window.",
};

function compactGas(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return formatNumber(n);
}

export default async function BlocksPage() {
  const [blocks, wm] = await Promise.all([latestBlocks(50), loadWatermarks()]);
  const range =
    wm.head != null
      ? `blocks ${wm.windowFloor != null ? formatNumber(wm.windowFloor) : "?"} → ${formatNumber(wm.head)}`
      : "";

  return (
    <Container className="space-y-[14px] pb-8 pt-6">
      <div className="flex flex-wrap items-baseline gap-[10px]">
        <h1 className="text-[20px] font-semibold tracking-[-0.02em]">latest blocks</h1>
        <span className="mono text-[11.5px] text-label">chain 4663 · orbit l2</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-y border-border-footer py-2">
        <HonestyLine right={range}>
          latest 50 blocks from the head of the indexed window.
        </HonestyLine>
      </div>

      <Panel>
        <ScrollX>
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="border-b border-border-strong bg-subtle text-left text-[10.5px] uppercase tracking-[0.03em] text-label">
                <th className="px-4 py-[9px] font-medium">block</th>
                <th className="px-4 py-[9px] font-medium">age</th>
                <th className="px-4 py-[9px] font-medium">sequencer</th>
                <th className="px-4 py-[9px] text-right font-medium">txns</th>
                <th className="px-4 py-[9px] text-right font-medium">gas used</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.number} className="border-b border-border-hair hover:bg-hover">
                  <td className="px-4 py-[11px]">
                    <BlockLink number={b.number} />
                  </td>
                  <td className="px-4 py-[11px] text-[12px] text-muted">
                    <TimeAgo iso={b.timestamp} />
                  </td>
                  <td className="px-4 py-[11px]">
                    <AddrLink address={b.miner} />
                  </td>
                  <td className="mono px-4 py-[11px] text-right text-secondary">
                    {formatNumber(b.txCount)}
                  </td>
                  <td className="mono px-4 py-[11px] text-right text-tertiary">
                    {compactGas(b.gasUsed)}
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
