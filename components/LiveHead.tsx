"use client";

// the home page's latest-blocks and latest-transactions columns. the initial
// data is server rendered and passed in as props (no client fetch on first
// render); this component then polls /api/head to follow the chain. the api route
// is uncached, everything below it on the page is not.

import { useEffect, useState } from "react";
import Link from "next/link";
import { TimeAgo } from "@/components/TimeAgo";
import { MethodBadge, StatusBadge } from "@/components/badges";
import { formatEth, shortAddr, shortHash } from "@/src/web/format";
import type { BlockSummary, TxSummary } from "@/src/web/lists";

interface HeadData {
  blocks: BlockSummary[];
  txns: TxSummary[];
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded border border-border bg-panel">
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-[13px] font-semibold text-text">latest blocks</h2>
          <span className="text-2xs text-faint">head</span>
        </header>
        <ul>
          {data.blocks.map((b) => (
            <li
              key={b.number}
              className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2 last:border-0"
            >
              <div className="min-w-0">
                <Link href={`/block/${b.number}`} className="mono font-medium">
                  {b.number.toLocaleString("en-US")}
                </Link>
                <div className="text-2xs text-faint">
                  <TimeAgo iso={b.timestamp} />
                </div>
              </div>
              <div className="text-right text-xs text-muted">
                <span className="mono">{b.txCount}</span> txns
                <div className="text-2xs text-faint">
                  miner <span className="mono">{shortAddr(b.miner, 6, 4)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded border border-border bg-panel">
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-[13px] font-semibold text-text">latest transactions</h2>
          <span className="text-2xs text-faint">head</span>
        </header>
        <ul>
          {data.txns.map((t) => (
            <li
              key={t.hash}
              className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2 last:border-0"
            >
              <div className="min-w-0">
                <Link href={`/tx/${t.hash}`} className="mono" title={t.hash}>
                  {shortHash(t.hash, 12, 8)}
                </Link>
                <div className="flex items-center gap-1.5 text-2xs text-faint">
                  <MethodBadge methodId={t.methodId} />
                  <span className="mono">{shortAddr(t.from, 5, 4)}</span>
                  <span>{"->"}</span>
                  <span className="mono">{t.to ? shortAddr(t.to, 5, 4) : "contract create"}</span>
                </div>
              </div>
              <div className="shrink-0 text-right text-xs">
                <div className="mono text-text">{formatEth(t.value, 5)} eth</div>
                <div className="text-2xs">
                  <StatusBadge status={t.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
