import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Panel, Field, Muted } from "@/components/primitives";
import { AddrLink, BlockLink } from "@/components/links";
import { CopyButton } from "@/components/CopyButton";
import { TimeAgo } from "@/components/TimeAgo";
import { StatusBadge, MethodBadge, SourceBadge, FinalityBadge } from "@/components/badges";
import { LiveFallbackNote } from "@/components/Disclosures";
import { InputData } from "@/components/InputData";
import { TxTransfers, TxLogsTable } from "@/components/tables";
import { resolveTx } from "@/src/resolve";
import { tokenMetas } from "@/src/web/tokens-web";
import { getEthUsd } from "@/src/web/price";
import { loadWatermarks, isFinal } from "@/src/web/cache";
import { feeBreakdown } from "@/src/web/arb";
import {
  formatEth,
  formatGwei,
  formatNumber,
  formatUtc,
  formatUsd,
  shortHash,
  weiToUsd,
} from "@/src/web/format";
import { methodSignature } from "@/src/web/methods";

export const revalidate = 5;

const isHash = (s: string) => /^0x[0-9a-fA-F]{64}$/.test(s);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>;
}): Promise<Metadata> {
  const { hash } = await params;
  return { title: `tx ${shortHash(hash)}` };
}

function usd(wei: string | null, ethUsd: number | null): string | null {
  if (wei == null || ethUsd == null) return null;
  return formatUsd(weiToUsd(wei, ethUsd));
}

export default async function TxPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  if (!isHash(hash)) notFound();
  const h = hash.toLowerCase();

  const [res, wm, ethUsd] = await Promise.all([resolveTx(h), loadWatermarks(), getEthUsd()]);
  if (!res.found || !res.tx) notFound();
  const tx = res.tx;

  const fee = feeBreakdown(tx);
  const metas = await tokenMetas(res.tokenTransfers.map((t) => t.tokenAddress));
  const final = isFinal(tx.blockNumber, wm.head);
  const sig = methodSignature(tx.methodId);
  const created = tx.contractAddress;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">transaction</h1>
        <StatusBadge status={tx.status} />
        <FinalityBadge final={final} />
        <SourceBadge source={res.source} />
      </div>

      {res.source === "rpc" && <LiveFallbackNote />}

      <Panel title="overview">
        <Field label="tx hash">
          <span className="mono break-all">{tx.hash}</span>
          <CopyButton value={tx.hash} />
        </Field>
        <Field label="status">
          <StatusBadge status={tx.status} />
        </Field>
        <Field label="block">
          <BlockLink number={tx.blockNumber} /> <Muted className="ml-1">index {tx.txIndex}</Muted>
        </Field>
        <Field label="timestamp">
          <TimeAgo iso={tx.blockTimestamp} />{" "}
          <span className="text-faint">({formatUtc(tx.blockTimestamp)})</span>
        </Field>
        <Field label="from">
          <AddrLink address={tx.from} short={false} />
        </Field>
        <Field label={created ? "contract created" : "to"}>
          {created ? (
            <AddrLink address={created} short={false} isToken />
          ) : tx.to ? (
            <AddrLink address={tx.to} short={false} />
          ) : (
            <Muted>-</Muted>
          )}
        </Field>
        <Field label="value">
          <span className="mono">{formatEth(tx.value, 8)} eth</span>
          {usd(tx.value, ethUsd) && <Muted className="ml-2">{usd(tx.value, ethUsd)}</Muted>}
        </Field>
        <Field label="method">
          <MethodBadge methodId={tx.methodId} />
          {sig && <span className="mono ml-2 text-2xs text-faint">{sig}</span>}
        </Field>
        <Field label="nonce">
          <span className="mono">{tx.nonce != null ? formatNumber(tx.nonce) : "-"}</span>
        </Field>
        <Field label="tx type">
          <span className="mono">{tx.txType != null ? tx.txType : "-"}</span>
        </Field>
      </Panel>

      <Panel
        title="fee (l2 breakdown)"
        right={<span>arbitrum orbit: gasUsed already includes the l1 data component</span>}
      >
        <Field label="total fee">
          {fee.totalFeeWei != null ? (
            <>
              <span className="mono">{formatEth(fee.totalFeeWei, 12)} eth</span>
              {usd(fee.totalFeeWei, ethUsd) && (
                <Muted className="ml-2">{usd(fee.totalFeeWei, ethUsd)}</Muted>
              )}
            </>
          ) : (
            <Muted>-</Muted>
          )}
        </Field>
        <Field label="effective gas price">
          <span className="mono">
            {fee.effectiveGasPriceWei != null ? `${formatGwei(fee.effectiveGasPriceWei)} gwei` : "-"}
          </span>
        </Field>
        <Field label="gas used (total)">
          <span className="mono">{fee.gasUsed != null ? formatNumber(fee.gasUsed) : "-"}</span>
        </Field>
        {fee.hasL1Split ? (
          <>
            <Field label="l2 execution gas">
              <span className="mono">{formatNumber(fee.l2GasUsed ?? 0)}</span>
              <Muted className="ml-2">
                fee <span className="mono">{formatEth(fee.l2FeeWei ?? "0", 12)} eth</span>
              </Muted>
            </Field>
            <Field label="l1 data gas (gasUsedForL1)">
              <span className="mono">{formatNumber(fee.gasUsedForL1 ?? 0)}</span>
              <Muted className="ml-2">
                fee <span className="mono">{formatEth(fee.l1FeeWei ?? "0", 12)} eth</span>
              </Muted>
            </Field>
            <Field label="l1 data share of fee">
              <span className="mono">{fee.l1SharePct != null ? `${fee.l1SharePct.toFixed(1)}%` : "-"}</span>
              <Muted className="ml-2">
                the l1 calldata cost is charged at the same gas price as execution,
                inside the single gasUsed figure, not added on top
              </Muted>
            </Field>
          </>
        ) : (
          <Field label="l1 data gas">
            <Muted>this receipt carried no gasUsedForL1, so the l1/l2 split is not shown.</Muted>
          </Field>
        )}
      </Panel>

      {res.tokenTransfers.length > 0 && (
        <Panel title={`token transfers (${res.tokenTransfers.length})`}>
          <TxTransfers transfers={res.tokenTransfers} metas={metas} />
        </Panel>
      )}

      <Panel title="input data">
        <div className="p-4">
          <InputData input={tx.input} methodId={tx.methodId} />
        </div>
      </Panel>

      {res.logs.length > 0 && (
        <Panel title={`event logs (${res.logs.length})`}>
          <TxLogsTable logs={res.logs} />
        </Panel>
      )}
    </div>
  );
}
