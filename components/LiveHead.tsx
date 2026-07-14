"use client";

// the home page's latest-blocks and latest-transactions columns. the initial
// data is server rendered and passed in as props (no client fetch on first
// render); this component then polls /api/head to follow the chain. the api route
// is uncached, everything below it on the page is not.

import { useEffect, useState } from "react";
import Link from "next/link";
import { TimeAgo } from "@/components/TimeAgo";
import { LiveLabel } from "@/components/honesty";
import { formatEth, formatNumber, shortAddr, shortHash } from "@/src/web/format";
import { methodLabel } from "@/src/web/methods";
import type { BlockSummary, TxSummary } from "@/src/web/lists";

interface HeadData {
  blocks: BlockSummary[];
  txns: TxSummary[];
}

function compactGas(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return formatNumber(n);
}

const CubeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M12 2 3 7v10l9 5 9-5V7l-9-5z" />
    <path d="M3 7l9 5 9-5M12 12v10" />
  </svg>
);

const DocIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M6 2h9l5 5v15H6z" />
    <path d="M14 2v6h6M9 13h6M9 17h6" />
  </svg>
);

const IconTile = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-7 w-7 flex-none items-center justify-center rounded-md border border-[#dcdfe4] text-muted">
    {children}
  </div>
);

function HeadCard({
  title,
  viewAll,
  children,
}: {
  title: string;
  viewAll: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border-strong bg-surface">
      <div className="flex items-center justify-between border-b border-border-hair px-[15px] py-3">
        <span className="text-[13.5px] font-semibold text-text">{title}</span>
        <LiveLabel />
      </div>
      <div>{children}</div>
      <div className="border-t border-border-hair py-[11px] text-center">
        <Link href={viewAll.href} className="text-[12px] text-label hover:text-green">
          {viewAll.label} →
        </Link>
      </div>
    </section>
  );
}

export function LiveHead({
  initial,
  intervalMs = 4000,
}: {
  initial: HeadData;
  intervalMs?: number;
}) {
  const [data, setData] = useState<HeadData>(initial);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/head", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as HeadData;
        if (alive && json?.blocks && json?.txns) setData(json);
      } catch {
        // transient; keep the last good data.
      }
    };
    const id = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return (
    <div className="grid grid-cols-1 gap-[14px] lg:grid-cols-2">
      <HeadCard title="latest blocks" viewAll={{ href: "/blocks", label: "view all blocks" }}>
        {data.blocks.map((b) => (
          <div
            key={b.number}
            className="flex items-center gap-[11px] border-b border-border-hair px-[15px] py-[5px] transition-colors hover:bg-hover"
          >
            <IconTile>
              <CubeIcon />
            </IconTile>
            <div className="w-[94px] flex-none">
              <Link href={`/block/${b.number}`} className="mono text-[12.5px]">
                {formatNumber(b.number)}
              </Link>
              <div className="mono text-[10px] text-muted">
                <TimeAgo iso={b.timestamp} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11.5px] text-label">
                seq{" "}
                <Link href={`/address/${b.miner}`} className="mono text-secondary" title={b.miner}>
                  {shortAddr(b.miner)}
                </Link>
              </div>
              <div className="mono text-[10px] text-muted">{formatNumber(b.txCount)} txns</div>
            </div>
            <div className="mono flex-none rounded border border-[#dcdfe4] px-[7px] py-[3px] text-[11px] text-tertiary">
              {compactGas(b.gasUsed)} gas
            </div>
          </div>
        ))}
      </HeadCard>

      <HeadCard
        title="latest transactions"
        viewAll={{ href: "/txs", label: "view all transactions" }}
      >
        {data.txns.map((t) => (
          <div
            key={t.hash}
            className="flex items-center gap-[11px] border-b border-border-hair px-[15px] py-[5px] transition-colors hover:bg-hover"
          >
            <IconTile>
              <DocIcon />
            </IconTile>
            <div className="w-[116px] flex-none">
              <Link href={`/tx/${t.hash}`} className="mono text-[12.5px]" title={t.hash}>
                {shortHash(t.hash, 6, 4)}
              </Link>
              <div className="mono text-[10px] text-muted">
                <TimeAgo iso={t.blockTimestamp} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] text-muted">
                from{" "}
                <Link href={`/address/${t.from}`} className="mono text-secondary" title={t.from}>
                  {shortAddr(t.from)}
                </Link>
              </div>
              <div className="truncate text-[11px] text-muted">
                to{" "}
                {t.to ? (
                  <Link href={`/address/${t.to}`} className="mono text-secondary" title={t.to}>
                    {shortAddr(t.to)}
                  </Link>
                ) : (
                  <span className="mono text-tertiary">contract create</span>
                )}
              </div>
            </div>
            <div className="flex flex-none flex-col items-end gap-1">
              <span className="rounded border border-[#dcdfe4] px-[6px] py-[1px] text-[10px] text-tertiary">
                {methodLabel(t.methodId)}
              </span>
              <span className="mono text-[10px] text-label">{formatEth(t.value, 4)} eth</span>
            </div>
          </div>
        ))}
      </HeadCard>
    </div>
  );
}
