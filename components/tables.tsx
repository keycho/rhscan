// the shared data tables: block transactions, address transactions, token
// transfers (both the token-page feed and the per-tx list), and event logs. all
// server rendered, all monospace for hex and figures, all wrapped so wide rows
// scroll inside their panel.

import { AddrLink, BlockLink, DirectionTag, TokenLink, TxLink } from "@/components/links";
import { MethodBadge, StatusBadge, TokenTypeBadge } from "@/components/badges";
import { Empty, ScrollX } from "@/components/primitives";
import { TimeAgo } from "@/components/TimeAgo";
import { formatEth, formatUnits, shortAddr, shortHash } from "@/src/web/format";
import type { TxView, LogView, TransferView } from "@/src/resolve";
import type { AddressTxRow } from "@/src/web/lists";
import type { TokenTransfer, TokenMeta } from "@/src/web/tokens-web";

function amount(value: string | null, meta?: TokenMeta, tokenId?: string | null): string {
  if (tokenId != null) return `#${tokenId}`;
  if (value == null) return "-";
  if (meta && meta.decimals != null) return formatUnits(value, meta.decimals, 6);
  return formatUnits(value, 0, 0);
}

// transactions inside a block.
export function BlockTxTable({ txs }: { txs: TxView[] }) {
  if (txs.length === 0) return <Empty>no transactions in this block.</Empty>;
  return (
    <ScrollX>
      <table className="w-full min-w-[820px] text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-faint">
            <th className="px-4 py-2 font-medium">tx hash</th>
            <th className="px-4 py-2 font-medium">method</th>
            <th className="px-4 py-2 font-medium">from</th>
            <th className="px-4 py-2 font-medium">to</th>
            <th className="px-4 py-2 text-right font-medium">value</th>
            <th className="px-4 py-2 font-medium">status</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((t) => (
            <tr key={t.hash} className="border-b border-border/60 hover:bg-panel2/60">
              <td className="px-4 py-2.5">
                <TxLink hash={t.hash} />
              </td>
              <td className="px-4 py-2.5">
                <MethodBadge methodId={t.methodId} />
              </td>
              <td className="px-4 py-2.5">
                <AddrLink address={t.from} />
              </td>
              <td className="px-4 py-2.5">
                {t.to ? (
                  <AddrLink address={t.to} />
                ) : (
                  <span className="text-2xs text-warn">contract creation</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right mono">{formatEth(t.value, 5)}</td>
              <td className="px-4 py-2.5">
                <StatusBadge status={t.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollX>
  );
}

// an address's transactions.
export function AddressTxTable({ rows, self }: { rows: AddressTxRow[]; self: string }) {
  if (rows.length === 0) return <Empty>no indexed transactions for this address.</Empty>;
  const me = self.toLowerCase();
  return (
    <ScrollX>
      <table className="w-full min-w-[860px] text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-faint">
            <th className="px-4 py-2 font-medium">tx hash</th>
            <th className="px-4 py-2 font-medium">method</th>
            <th className="px-4 py-2 font-medium">block</th>
            <th className="px-4 py-2 font-medium">age</th>
            <th className="px-4 py-2 font-medium"></th>
            <th className="px-4 py-2 font-medium">from</th>
            <th className="px-4 py-2 font-medium">to</th>
            <th className="px-4 py-2 text-right font-medium">value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={`${t.blockNumber}:${t.txIndex}`} className="border-b border-border/60 hover:bg-panel2/60">
              <td className="px-4 py-2.5">
                <TxLink hash={t.hash} />
              </td>
              <td className="px-4 py-2.5">
                <MethodBadge methodId={t.methodId} />
              </td>
              <td className="px-4 py-2.5">
                <BlockLink number={t.blockNumber} />
              </td>
              <td className="px-4 py-2.5 text-muted text-xs">
                {t.blockTimestamp ? <TimeAgo iso={t.blockTimestamp} /> : "-"}
              </td>
              <td className="px-4 py-2.5">
                <DirectionTag direction={t.direction} />
              </td>
              <td className="px-4 py-2.5">
                {t.from ? (
                  t.from.toLowerCase() === me ? (
                    <span className="mono text-muted" title={t.from}>
                      {shortAddr(t.from)}
                    </span>
                  ) : (
                    <AddrLink address={t.from} />
                  )
                ) : (
                  "-"
                )}
              </td>
              <td className="px-4 py-2.5">
                {t.to ? (
                  t.to.toLowerCase() === me ? (
                    <span className="mono text-muted" title={t.to}>
                      {shortAddr(t.to)}
                    </span>
                  ) : (
                    <AddrLink address={t.to} />
                  )
                ) : (
                  <span className="text-2xs text-warn">contract creation</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right mono">{formatEth(t.value, 5)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollX>
  );
}

// a token's transfer feed.
export function TokenTransfersTable({
  transfers,
  decimals,
  symbol,
}: {
  transfers: TokenTransfer[];
  decimals: number | null;
  symbol: string | null;
}) {
  if (transfers.length === 0) return <Empty>no transfers indexed in the window.</Empty>;
  const meta: TokenMeta = { decimals, symbol, name: null, tokenType: null };
  return (
    <ScrollX>
      <table className="w-full min-w-[820px] text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-faint">
            <th className="px-4 py-2 font-medium">tx hash</th>
            <th className="px-4 py-2 font-medium">block</th>
            <th className="px-4 py-2 font-medium">age</th>
            <th className="px-4 py-2 font-medium">from</th>
            <th className="px-4 py-2 font-medium">to</th>
            <th className="px-4 py-2 text-right font-medium">amount</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((t) => (
            <tr key={`${t.blockNumber}:${t.logIndex}`} className="border-b border-border/60 hover:bg-panel2/60">
              <td className="px-4 py-2.5">
                <TxLink hash={t.txHash} />
              </td>
              <td className="px-4 py-2.5">
                <BlockLink number={t.blockNumber} />
              </td>
              <td className="px-4 py-2.5 text-muted text-xs">
                <TimeAgo iso={t.blockTimestamp} />
              </td>
              <td className="px-4 py-2.5">
                <AddrLink address={t.from} />
              </td>
              <td className="px-4 py-2.5">
                <AddrLink address={t.to} />
              </td>
              <td className="px-4 py-2.5 text-right mono">
                {amount(t.value, meta, t.tokenId)}
                {symbol && t.tokenId == null && <span className="ml-1 text-faint">{symbol}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollX>
  );
}

// token transfers that occurred inside a single transaction.
export function TxTransfers({
  transfers,
  metas,
}: {
  transfers: TransferView[];
  metas: Record<string, TokenMeta>;
}) {
  if (transfers.length === 0) return null;
  return (
    <div className="divide-y divide-border/60">
      {transfers.map((t) => {
        const meta = metas[t.tokenAddress.toLowerCase()];
        return (
          <div
            key={t.logIndex}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-xs"
          >
            <TokenTypeBadge type={t.tokenType} />
            <span className="text-faint">from</span>
            <AddrLink address={t.from} />
            <span className="text-faint">to</span>
            <AddrLink address={t.to} />
            <span className="text-faint">for</span>
            <span className="mono text-text">{amount(t.value, meta, t.tokenId)}</span>
            <TokenLink address={t.tokenAddress}>
              {meta?.symbol ?? shortAddr(t.tokenAddress)}
            </TokenLink>
          </div>
        );
      })}
    </div>
  );
}

// raw event logs emitted by a transaction.
export function TxLogsTable({ logs }: { logs: LogView[] }) {
  if (logs.length === 0) return <Empty>no logs.</Empty>;
  return (
    <div className="divide-y divide-border/60">
      {logs.map((l) => (
        <div key={l.logIndex} className="px-4 py-3 text-xs">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-faint">#{l.logIndex}</span>
            <AddrLink address={l.address} />
          </div>
          <div className="scroll-x mono space-y-0.5 text-2xs text-muted">
            {l.topics.map((topic, i) => (
              <div key={i} className="break-all">
                <span className="text-faint">topic{i} </span>
                {topic}
              </div>
            ))}
            {l.data && l.data !== "0x" && (
              <div className="break-all">
                <span className="text-faint">data </span>
                {shortHash(l.data, 20, 8)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
