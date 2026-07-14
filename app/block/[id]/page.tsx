import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container, Panel, Field } from "@/components/primitives";
import { BlockTxTable } from "@/components/tables";
import { AddrLink, TxLink } from "@/components/links";
import { CopyButton } from "@/components/CopyButton";
import { TimeAgo } from "@/components/TimeAgo";
import { FinalityBadge, SourceBadge } from "@/components/badges";
import { LiveFallbackNote } from "@/components/Disclosures";
import { PrevNext } from "@/components/Pagination";
import { resolveBlock } from "@/src/resolve";
import { loadBlockByNumber, loadWatermarks, isFinal } from "@/src/web/cache";
import { formatEth, formatGwei, formatNumber, formatUtc, gasPercent, shortHash } from "@/src/web/format";

// db-backed: render at request time so `next build` runs no query.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const isNum = (s: string) => /^[0-9]+$/.test(s);
const isHash = (s: string) => /^0x[0-9a-fA-F]{64}$/.test(s);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `block ${isNum(id) ? formatNumber(Number(id)) : shortHash(id)}` };
}

export default async function BlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wm = await loadWatermarks();

  let result;
  if (isNum(id)) {
    result = await loadBlockByNumber(Number(id), wm.head);
  } else if (isHash(id)) {
    result = await resolveBlock(id.toLowerCase());
  } else {
    notFound();
  }

  if (!result.found || !result.block) notFound();
  const b = result.block;
  const final = isFinal(b.number, wm.head);
  const gasPct = gasPercent(b.gasUsed, b.gasLimit);

  const prev = b.number > 0 ? `/block/${b.number - 1}` : null;
  const next = wm.head == null || b.number < wm.head ? `/block/${b.number + 1}` : null;

  return (
    <Container className="space-y-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">block {formatNumber(b.number)}</h1>
          <FinalityBadge final={final} />
          <SourceBadge source={result.source} />
        </div>
        <PrevNext prev={prev} next={next} />
      </div>

      {result.source === "rpc" && <LiveFallbackNote />}

      <Panel title="overview">
        <Field label="block height">
          <span className="mono">{formatNumber(b.number)}</span>
        </Field>
        <Field label="timestamp">
          <TimeAgo iso={b.timestamp} /> <span className="text-faint">({formatUtc(b.timestamp)})</span>
        </Field>
        <Field label="transactions">
          <span className="mono">{formatNumber(b.txCount)}</span>
        </Field>
        <Field label="fee recipient">
          <AddrLink address={b.miner} short={false} />
        </Field>
        <Field label="gas used">
          <span className="mono">{formatNumber(b.gasUsed)}</span>
          {gasPct != null && <span className="ml-2 text-faint">({gasPct.toFixed(1)}%)</span>}
        </Field>
        <Field label="gas limit">
          <span className="mono">{formatNumber(b.gasLimit)}</span>
        </Field>
        <Field label="base fee per gas">
          <span className="mono">
            {b.baseFeePerGas != null ? `${formatGwei(b.baseFeePerGas)} gwei` : "-"}
          </span>
          {b.baseFeePerGas != null && (
            <span className="ml-2 text-faint mono">({formatEth(b.baseFeePerGas, 12)} eth)</span>
          )}
        </Field>
        <Field label="l1 block number">
          <span className="mono">{b.l1BlockNumber != null ? formatNumber(b.l1BlockNumber) : "-"}</span>
        </Field>
        <Field label="size">
          <span className="mono">{b.size != null ? `${formatNumber(b.size)} bytes` : "-"}</span>
        </Field>
        <Field label="hash">
          <span className="mono break-all">{b.hash}</span>
          <CopyButton value={b.hash} />
        </Field>
        <Field label="parent hash">
          {b.number > 0 ? (
            <a href={`/block/${b.number - 1}`} className="mono break-all">
              {b.parentHash}
            </a>
          ) : (
            <span className="mono break-all">{b.parentHash}</span>
          )}
        </Field>
      </Panel>

      <Panel title={`transactions (${formatNumber(result.transactions.length)})`}>
        <BlockTxTable txs={result.transactions} />
      </Panel>
    </Container>
  );
}
