import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Panel, Field, Muted, Pill, Empty } from "@/components/primitives";
import { AddrLink, TxLink } from "@/components/links";
import { CopyButton } from "@/components/CopyButton";
import { TokenTypeBadge } from "@/components/badges";
import { Tabs } from "@/components/Tabs";
import { HoldersTable } from "@/components/HoldersTable";
import { TokenTransfersTable } from "@/components/tables";
import { CollisionTable } from "@/components/CollisionTable";
import { DriftBanner, Note } from "@/components/Disclosures";
import { getTokenOverview, deployerTokens } from "@/src/holders";
import { collidingTokens, tokenTransfers } from "@/src/web/tokens-web";
import { loadDrift } from "@/src/web/cache";
import { formatNumber, formatShare, formatUnits, shortAddr } from "@/src/web/format";

export const revalidate = 20;

const isAddr = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ addr: string }>;
}): Promise<Metadata> {
  const { addr } = await params;
  return { title: `token ${shortAddr(addr)}` };
}

export default async function TokenPage({
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

  const overview = await getTokenOverview(a);
  const others = await collidingTokens(a, overview.name, overview.symbol);
  const deployer = overview.stats?.deployerAddress ?? null;
  const deployerOther = deployer ? await deployerTokens(deployer, 12) : [];
  const deployerElse = deployerOther.filter((t) => t.address.toLowerCase() !== a);

  const active = tab === "holders" ? "holders" : "transfers";
  const transfers = active === "transfers" ? await tokenTransfers(a, 50) : [];
  const drift =
    active === "holders"
      ? await loadDrift(a, overview.hydratedAtBlock, overview.topHolders)
      : null;

  const tabs = [
    { key: "transfers", label: "transfers", count: overview.stats?.transferCount ?? null },
    { key: "holders", label: "holders", count: overview.stats?.holderCount ?? null },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{overview.name ?? "unnamed token"}</h1>
        {overview.symbol && <span className="text-muted">{overview.symbol}</span>}
        <TokenTypeBadge type={overview.tokenType} />
        {overview.hydrating && (
          <Pill tone="warn" title="holder balances are being replayed from Transfer history">
            hydrating
          </Pill>
        )}
      </div>

      {others.length > 0 && (
        <Panel
          title={`name collision: ${others.length} other ${
            others.length === 1 ? "token" : "tokens"
          } share this name or symbol`}
        >
          <div className="border-b border-border px-4 py-2 text-xs text-muted">
            impersonation is common on this chain. these contracts use the same name
            or symbol as this one. compare deployer, age and concentration; the
            numbers are shown, the judgement is yours.
          </div>
          <CollisionTable tokens={others} />
        </Panel>
      )}

      <Panel title="overview">
        <Field label="contract">
          <span className="mono break-all">{a}</span>
          <CopyButton value={a} />
        </Field>
        <Field label="name / symbol">
          {overview.name ?? <Muted>unknown</Muted>}
          {overview.symbol && <span className="ml-1.5 text-muted">{overview.symbol}</span>}
        </Field>
        <Field label="type">
          <span className="mono">{overview.tokenType ?? "unknown"}</span>
        </Field>
        <Field label="decimals">
          <span className="mono">{overview.decimals != null ? overview.decimals : "-"}</span>
        </Field>
        <Field label="total supply">
          <span className="mono">
            {overview.totalSupply != null
              ? formatUnits(overview.totalSupply, overview.decimals ?? 18, 6)
              : "-"}
          </span>
        </Field>
        <Field label="holders">
          <span className="mono">
            {overview.stats?.holderCount != null ? formatNumber(overview.stats.holderCount) : "-"}
          </span>
        </Field>
        <Field label="transfers (all-time)">
          <span className="mono">
            {overview.stats?.transferCount != null
              ? formatNumber(overview.stats.transferCount)
              : "-"}
          </span>
        </Field>
        <Field label="deployer">
          {deployer ? <AddrLink address={deployer} short={false} /> : <Muted>unknown</Muted>}
        </Field>
        <Field label="deployer holds">
          <span className="mono">{formatShare(overview.stats?.deployerBalanceShare)}</span>
          <Muted className="ml-2">of supply</Muted>
        </Field>
        <Field label="top-10 concentration">
          <span className="mono">{formatShare(overview.stats?.top10Share)}</span>
        </Field>
        <Field label="first transfer">
          <span className="mono">
            {overview.stats?.firstTransferBlock != null
              ? `block ${formatNumber(overview.stats.firstTransferBlock)}`
              : "-"}
          </span>
        </Field>
      </Panel>

      {deployerElse.length > 0 && (
        <Panel title={`this deployer also launched ${formatNumber(deployerElse.length)}`}>
          <ul className="divide-y divide-border/60">
            {deployerElse.map((t) => (
              <li key={t.address} className="flex items-center justify-between gap-3 px-4 py-2 text-[13px]">
                <Link href={`/token/${t.address}`} className="text-text hover:text-accent">
                  {t.name ?? "unnamed"}
                  {t.symbol && <span className="ml-1.5 text-muted">{t.symbol}</span>}
                </Link>
                <span className="mono text-2xs text-faint">
                  {t.creationBlock != null ? `block ${formatNumber(t.creationBlock)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel>
        <Tabs tabs={tabs} active={active} basePath={`/token/${a}`} />
        {active === "transfers" && (
          <TokenTransfersTable
            transfers={transfers}
            decimals={overview.decimals}
            symbol={overview.symbol}
          />
        )}
        {active === "holders" && (
          <div>
            {overview.hydrating ? (
              <div className="p-4">
                <Note>
                  holder balances are still being replayed from this token&apos;s full
                  Transfer history. check back shortly; the list will appear once
                  hydration completes.
                </Note>
              </div>
            ) : (
              <>
                {drift && (
                  <div className="p-4 pb-0">
                    <DriftBanner report={drift} />
                  </div>
                )}
                <div className="mt-3">
                  {overview.topHolders.length === 0 ? (
                    <Empty>no holders indexed.</Empty>
                  ) : (
                    <HoldersTable
                      holders={overview.topHolders}
                      decimals={overview.decimals}
                      totalSupply={overview.totalSupply}
                      drift={drift!}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
