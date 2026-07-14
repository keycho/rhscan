import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Container, Panel, KV, Muted, Empty } from "@/components/primitives";
import { AddrLink } from "@/components/links";
import { CopyButton } from "@/components/CopyButton";
import { TokenTypeBadge } from "@/components/badges";
import { TokenAvatar } from "@/components/TokenAvatar";
import { Tabs } from "@/components/Tabs";
import { HoldersTable } from "@/components/HoldersTable";
import { HoldersOverview } from "@/components/HoldersOverview";
import { TokenTransfersTable } from "@/components/tables";
import { CollisionTable } from "@/components/CollisionTable";
import { DriftBanner, Note } from "@/components/Disclosures";
import { AmberDot } from "@/components/honesty";
import { getTokenOverview } from "@/src/holders";
import { collidingTokens, tokenTransfers } from "@/src/web/tokens-web";
import { loadDrift } from "@/src/web/cache";
import { holderAnalytics } from "@/src/web/holder-analytics";
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

  const active = tab === "transfers" ? "transfers" : "holders";
  const transfers = active === "transfers" ? await tokenTransfers(a, 50) : [];
  const drift =
    active === "holders"
      ? await loadDrift(a, overview.hydratedAtBlock, overview.topHolders)
      : null;

  const stats = overview.stats;
  const analytics =
    active === "holders"
      ? holderAnalytics(overview.topHolders, overview.totalSupply, stats?.holderCount ?? null)
      : null;
  const shown = overview.topHolders.length;
  const typeLabel = overview.tokenType ?? "token";

  const tabs = [
    { key: "holders", label: "holders", count: stats?.holderCount ?? null },
    { key: "transfers", label: "transfers", count: stats?.transferCount ?? null },
  ];

  return (
    <Container className="pb-8 pt-5">
      {/* breadcrumb */}
      <div className="mono mb-3 text-[11px] text-muted">
        <Link href="/tokens" className="text-label">
          tokens
        </Link>{" "}
        / {typeLabel.toLowerCase()} / {overview.symbol ?? shortAddr(a)}
      </div>

      {/* identity */}
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-[13px]">
          <TokenAvatar address={a} symbol={overview.symbol} name={overview.name} size={42} fontSize={14} />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[21px] font-semibold tracking-[-0.02em]">
                {overview.name ?? "unnamed token"}
              </span>
              {overview.symbol && (
                <span className="mono text-[14px] text-label">{overview.symbol}</span>
              )}
            </div>
            <div className="mono mt-[2px] text-[11px] text-muted">
              {overview.tokenType ?? "unknown type"}
              {overview.hydrating && <span className="ml-2 text-amber">· hydrating</span>}
            </div>
          </div>
        </div>
        {overview.tokenType && (
          <div className="mono rounded-md border border-border bg-surface px-[13px] py-[7px] text-[13px] text-tertiary">
            {overview.tokenType}
          </div>
        )}
      </div>

      {/* overview + activity */}
      <div className="mb-[18px] grid grid-cols-1 gap-[14px] lg:grid-cols-2">
        <Panel title="overview">
          <KV label="contract">
            <span className="inline-flex items-center gap-[7px]">
              <AddrLink address={a} short label={shortAddr(a, 10, 8)} />
              <CopyButton value={a} />
            </span>
          </KV>
          <KV label="total supply">
            <span className="mono">
              {overview.totalSupply != null
                ? `${formatUnits(overview.totalSupply, overview.decimals ?? 18, 4)}${
                    overview.symbol ? ` ${overview.symbol}` : ""
                  }`
                : "—"}
            </span>
          </KV>
          <KV label="holders">
            <span className="mono">
              {stats?.holderCount != null ? formatNumber(stats.holderCount) : "—"}
            </span>
          </KV>
          <KV label="decimals">
            <span className="mono">{overview.decimals != null ? overview.decimals : "—"}</span>
          </KV>
        </Panel>

        <Panel title="activity">
          <KV label="transfers (all-time)">
            <span className="mono">
              {stats?.transferCount != null ? formatNumber(stats.transferCount) : "—"}
            </span>
          </KV>
          <KV label="top-10 concentration">
            <span className="mono">{formatShare(stats?.top10Share)}</span>
          </KV>
          <KV label="deployer">
            {stats?.deployerAddress ? (
              <AddrLink address={stats.deployerAddress} />
            ) : (
              <Muted>unknown</Muted>
            )}
          </KV>
          <KV label="token type">
            {overview.tokenType ? <TokenTypeBadge type={overview.tokenType} /> : <Muted>unknown</Muted>}
          </KV>
        </Panel>
      </div>

      {/* tabs */}
      <div className="mb-4">
        <Tabs tabs={tabs} active={active} basePath={`/token/${a}`} />
      </div>

      {active === "holders" ? (
        overview.hydrating ? (
          <Note>
            holder balances are still being replayed from this token&apos;s full Transfer history.
            check back shortly; the list will appear once hydration completes.
          </Note>
        ) : overview.topHolders.length === 0 ? (
          <Panel>
            <Empty>no holders indexed.</Empty>
          </Panel>
        ) : (
          <>
            {analytics && <HoldersOverview analytics={analytics} holderCount={stats?.holderCount ?? null} />}
            {drift && (drift.flagged || !drift.verifiable) && (
              <div className="mb-[14px]">
                <DriftBanner report={drift} />
              </div>
            )}
            <Panel>
              <HoldersTable
                holders={overview.topHolders}
                decimals={overview.decimals}
                totalSupply={overview.totalSupply}
                drift={drift!}
              />
              <div className="border-t border-border-hair px-4 py-3 text-center text-[12px] text-label">
                showing top {formatNumber(shown)}
                {stats?.holderCount != null && stats.holderCount > shown
                  ? ` of ${formatNumber(stats.holderCount)}`
                  : ""}{" "}
                holders
              </div>
            </Panel>
          </>
        )
      ) : (
        <Panel>
          <TokenTransfersTable
            transfers={transfers}
            decimals={overview.decimals}
            symbol={overview.symbol}
          />
        </Panel>
      )}

      {/* name collisions — a core honesty surface on this chain */}
      {others.length > 0 && (
        <div className="mt-[14px]">
          <Panel
            title={`name collision: ${others.length} other ${
              others.length === 1 ? "token" : "tokens"
            } share this name or symbol`}
          >
            <div className="border-b border-border-hair px-4 py-2 text-xs text-label">
              impersonation is common on this chain. these contracts use the same name or symbol as
              this one. compare deployer, age and concentration; the numbers are shown, the judgement
              is yours.
            </div>
            <CollisionTable tokens={others} />
          </Panel>
        </div>
      )}

      {/* footer honesty line */}
      <div className="mt-4 flex items-center gap-2">
        <AmberDot />
        <span className="text-[11px] text-label">
          holder balances are replayed from indexed Transfer events and checked against live
          balanceOf · rolling window
        </span>
      </div>
    </Container>
  );
}
