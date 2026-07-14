import type { Metadata } from "next";
import { Container, Panel } from "@/components/primitives";
import { AmberDot } from "@/components/honesty";
import { TokenTable } from "@/components/TokenTable";
import { topTokens, newTokenFeed } from "@/src/web/tokens-web";
import { loadWatermarks } from "@/src/web/cache";
import { formatNumber } from "@/src/web/format";

// db-backed: render at request time so `next build` runs no query.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "tokens",
  description:
    "erc-20 token tracker for robinhood chain, ranked by real transfer activity across the indexed window — no sponsored placements.",
};

export default async function TokensPage() {
  const [top, fresh, wm] = await Promise.all([
    topTokens(30),
    newTokenFeed(15),
    loadWatermarks(),
  ]);

  const range =
    wm.head != null
      ? `blocks ${wm.windowFloor != null ? formatNumber(wm.windowFloor) : "?"} → ${formatNumber(wm.head)}`
      : "";

  return (
    <Container className="pb-8 pt-6">
      <div className="mb-1 flex flex-wrap items-baseline gap-[10px]">
        <h1 className="text-[20px] font-semibold tracking-[-0.02em]">token tracker</h1>
        <span className="mono text-[11.5px] text-label">erc-20 · robinhood chain</span>
      </div>

      {/* honesty line replaces the usual sponsored ad row */}
      <div className="my-[14px] flex flex-wrap items-center gap-2 border-y border-border-footer py-2">
        <AmberDot />
        <span className="text-[11.5px] text-label">
          ranked by transfer activity across the indexed window — no sponsored placements.
        </span>
        {range && <span className="mono ml-auto text-[11px] text-muted">{range}</span>}
      </div>

      {/* tracker */}
      <section className="overflow-hidden rounded-lg border border-border-strong bg-surface">
        <div className="flex flex-wrap items-baseline gap-2 border-b border-border-hair px-4 py-[13px]">
          <span className="text-[13px] text-text">
            showing top <span className="mono font-semibold">{formatNumber(top.length)}</span> tokens
          </span>
          <span className="text-[11.5px] text-muted">· by all-time transfer activity</span>
        </div>
        <TokenTable tokens={top} />
      </section>

      <Panel title="newly deployed" right={<span>newest contract deployments</span>} className="mt-[14px]">
        <TokenTable tokens={fresh} />
      </Panel>
    </Container>
  );
}
