import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Container, Panel, Field, Muted, Empty, ScrollX, Pill } from "@/components/primitives";
import { AddrLink, TxLink, TokenLink } from "@/components/links";
import { CopyButton } from "@/components/CopyButton";
import { AddressTxTable } from "@/components/tables";
import { Tabs, type TabDef } from "@/components/Tabs";
import { AddressTruncationNote, Note } from "@/components/Disclosures";
import { addressHeader, addressTxRefs } from "@/src/web/address";
import { enrichAddressTxns } from "@/src/web/lists";
import { addressHoldings, isKnownToken } from "@/src/web/tokens-web";
import { getEthUsd } from "@/src/web/price";
import { formatEth, formatNumber, formatUnits, formatUsd, shortAddr, weiToUsd } from "@/src/web/format";

// db-backed: render at request time so `next build` runs no query.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const isAddr = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ addr: string }>;
}): Promise<Metadata> {
  const { addr } = await params;
  return { title: `address ${shortAddr(addr)}` };
}

export default async function AddressPage({
  params,
  searchParams,
}: {
  params: Promise<{ addr: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { addr } = await params;
  if (!isAddr(addr)) notFound();
  const a = addr.toLowerCase();
  const { tab } = await searchParams;

  const [header, refsResult, holdings, ethUsd, knownToken] = await Promise.all([
    addressHeader(a),
    addressTxRefs(a, 50),
    addressHoldings(a, 100),
    getEthUsd(),
    isKnownToken(a),
  ]);
  const rows = await enrichAddressTxns(refsResult.refs);

  const balanceUsd = ethUsd != null ? formatUsd(weiToUsd(header.balance, ethUsd)) : null;

  const tabs: TabDef[] = [
    { key: "transactions", label: "transactions", count: rows.length },
    { key: "tokens", label: "token holdings", count: holdings.length },
  ];
  if (header.isContract) tabs.push({ key: "contract", label: "contract", count: null });
  const active = tabs.some((t) => t.key === tab) ? tab! : "transactions";

  return (
    <Container className="space-y-4 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{header.isContract ? "contract" : "address"}</h1>
        <Pill tone={header.isContract ? "accent" : "neutral"}>
          {header.isContract ? "contract" : "eoa"}
        </Pill>
        {knownToken && (
          <Link href={`/token/${a}`} className="text-xs text-accent hover:text-accent-hover">
            view as token
          </Link>
        )}
      </div>

      <Panel title="overview">
        <Field label="address">
          <span className="mono break-all">{header.address}</span>
          <CopyButton value={header.address} />
        </Field>
        <Field label="balance">
          <span className="mono">{formatEth(header.balance, 8)} eth</span>
          {balanceUsd && <Muted className="ml-2">{balanceUsd}</Muted>}
          <Muted className="ml-2 text-2xs">(live)</Muted>
        </Field>
        <Field label="nonce">
          <span className="mono">{formatNumber(header.nonce)}</span>
        </Field>
        {header.isContract && (
          <>
            <Field label="code size">
              <span className="mono">{formatNumber(header.codeSize)} bytes</span>
            </Field>
            {header.creation && (
              <>
                <Field label="creator">
                  {header.creation.creator ? (
                    <AddrLink address={header.creation.creator} short={false} />
                  ) : (
                    <Muted>unknown</Muted>
                  )}
                </Field>
                <Field label="creation tx">
                  {header.creation.creationTx ? (
                    <TxLink hash={header.creation.creationTx} short={false} />
                  ) : (
                    <Muted>unknown</Muted>
                  )}
                </Field>
              </>
            )}
          </>
        )}
      </Panel>

      <Panel>
        <Tabs tabs={tabs} active={active} basePath={`/address/${a}`} />
        {active === "transactions" && (
          <div className="space-y-0">
            <AddressTxTable rows={rows} self={a} />
            <div className="p-4">
              <AddressTruncationNote windowFloor={header.windowFloor} />
            </div>
          </div>
        )}
        {active === "tokens" &&
          (holdings.length === 0 ? (
            <Empty>no token balances indexed for this address.</Empty>
          ) : (
            <ScrollX>
              <table className="w-full min-w-[560px] text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-faint">
                    <th className="px-4 py-2 font-medium">token</th>
                    <th className="px-4 py-2 font-medium">contract</th>
                    <th className="px-4 py-2 text-right font-medium">balance</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.tokenAddress} className="border-b border-border/60 hover:bg-panel2/60">
                      <td className="px-4 py-2.5">
                        <Link href={`/token/${h.tokenAddress}`} className="text-text hover:text-accent">
                          {h.name ?? "unnamed"}
                        </Link>
                        {h.symbol && <span className="ml-1.5 text-muted">{h.symbol}</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <TokenLink address={h.tokenAddress} />
                      </td>
                      <td className="px-4 py-2.5 text-right mono">
                        {formatUnits(h.balance, h.decimals ?? 18, 6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>
          ))}
        {active === "contract" && (
          <div className="p-4">
            <Note>
              contract source verification is not wired up on this chain yet. this
              tab shows deployment facts only; decoded source, abi and read/write
              methods are out of scope for now.
            </Note>
          </div>
        )}
      </Panel>
    </Container>
  );
}
