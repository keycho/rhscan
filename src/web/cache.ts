// caching helpers that encode the coverage model.
//
// anything a safe distance below the head is immutable (a reorg only ever touches
// the last handful of blocks), so a confirmed point lookup can be cached hard and
// never recomputed. head-adjacent data gets short revalidation instead, handled
// at the route-segment level (see each page's `revalidate`). on vercel the route
// revalidate becomes the cdn s-maxage / stale-while-revalidate window; the
// unstable_cache wrappers here are the "immutable below head" hard cache.

import { unstable_cache } from "next/cache";
import { resolveBlock, type BlockResult } from "../resolve.js";
import { getWatermarks, type Watermarks } from "./watermarks.js";
import { getNetworkStats, txPerDay, type NetworkStats, type DayBucket } from "./stats.js";
import { checkHolderDrift, type DriftReport } from "./drift.js";
import type { Holder } from "../holders.js";

// blocks within this many of the head may still reorg; above it, treat as final.
export const REORG_DEPTH = 30;
const YEAR = 60 * 60 * 24 * 365;

// an in-process TTL memo. deliberately NOT next's unstable_cache for these
// frequently-refreshed reads. unstable_cache does stale-while-revalidate with a
// BACKGROUND refresh, and on vercel that background query runs after the response
// while the serverless instance is frozen/reclaimed. against the pgbouncer
// transaction pooler that kills the query mid-flight (CONNECTION_CLOSED /
// ECHECKOUTTIMEOUT / EDBHANDLEREXITED) and poisons the shared max:1 postgres.js
// connection for the next request — the production 500 loop, all logged under
// "revalidating cache with key ...". this memo instead recomputes INLINE on
// expiry, inside the request, on a live connection, and shares one in-flight
// promise so concurrent callers never stampede the single connection. it is
// per-instance (no cross-instance cache), which is fine: each read is ~1ms and
// refreshes at most once per ttl per warm instance, always within a request.
function memoTTL<T>(fn: () => Promise<T>, ttlMs: number): () => Promise<T> {
  let value: T | undefined;
  let expiry = 0;
  let inflight: Promise<T> | null = null;
  return () => {
    if (value !== undefined && Date.now() < expiry) return Promise.resolve(value);
    if (inflight) return inflight;
    inflight = fn()
      .then((v) => {
        value = v;
        expiry = Date.now() + ttlMs;
        return v;
      })
      .catch((err: unknown) => {
        // a pooler blip degrades to the last good value instead of throwing.
        if (value !== undefined) return value;
        throw err;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };
}

// watermarks (head + floors) change every block, but a few seconds stale in the
// chrome is fine; the /api/head poller carries the live head separately.
export const loadWatermarks = memoTTL((): Promise<Watermarks> => getWatermarks(), 10_000);

// network stats feed the utility strip (layout, every route) and the home card.
export const loadNetworkStats = memoTTL((): Promise<NetworkStats> => getNetworkStats(), 15_000);

// the per-day tx chart changes slowly and is home-only.
export const loadTxPerDay = memoTTL((): Promise<DayBucket[]> => txPerDay(), 600_000);

// a block by number, cached for a year once it is below the reorg depth. a
// head-adjacent block is read fresh so a just-mined block is never stale.
export async function loadBlockByNumber(n: number, head: number | null): Promise<BlockResult> {
  const immutable = head != null && n <= head - REORG_DEPTH;
  if (!immutable) return resolveBlock(n);
  const cached = unstable_cache(() => resolveBlock(n), ["block-immutable", String(n)], {
    revalidate: YEAR,
  });
  return cached();
}

export function isFinal(blockNumber: number | null, head: number | null): boolean {
  if (blockNumber == null || head == null) return true;
  return blockNumber <= head - REORG_DEPTH;
}

// the holder balance-drift check compares replayed balances against live
// balanceOf at the hydrated block, which is immutable state, so the result is
// cached hard keyed by (token, block). a token not yet hydrated is checked
// uncached (there is nothing stable to key on).
export async function loadDrift(
  token: string,
  hydratedBlock: number | null,
  holders: Holder[],
): Promise<DriftReport> {
  if (hydratedBlock == null) return checkHolderDrift(token, null, holders);
  const cached = unstable_cache(
    () => checkHolderDrift(token, hydratedBlock, holders),
    ["drift", token.toLowerCase(), String(hydratedBlock)],
    { revalidate: YEAR },
  );
  return cached();
}
