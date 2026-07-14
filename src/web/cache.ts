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
import { checkHolderDrift, type DriftReport } from "./drift.js";
import type { Holder } from "../holders.js";

// blocks within this many of the head may still reorg; above it, treat as final.
export const REORG_DEPTH = 30;
const YEAR = 60 * 60 * 24 * 365;

// watermarks change every block; a few seconds of sharing across a request tree
// is fine and keeps every component from re-reading sync_state.
export const loadWatermarks = unstable_cache(
  async (): Promise<Watermarks> => getWatermarks(),
  ["watermarks"],
  { revalidate: 3 },
);

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
