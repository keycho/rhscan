// search dispatch.
//
//   0x + 64 hex   a tx or block hash, resolved through tx_locations /
//                 block_locations (and the cold path on a miss), never by
//                 scanning partitions
//   0x + 40 hex   an address, or a token if we hold token metadata for it
//   bare number   a block number
//   anything else a token name or symbol: if exactly one token matches, go to
//                 it; if several collide, show them all; if none, not found
//
// the collision case is the whole point of the explorer, so a name that matches
// more than one contract never silently picks one.

import { resolveQuery } from "../resolve.js";
import { isKnownToken, tokenCollisions, type TokenCard } from "./tokens-web.js";

export type SearchResult =
  | { kind: "redirect"; to: string }
  | { kind: "collisions"; term: string; tokens: TokenCard[] }
  | { kind: "not-found"; query: string };

const HASH64 = /^0x[0-9a-fA-F]{64}$/;
const HASH40 = /^0x[0-9a-fA-F]{40}$/;
const NUMBER = /^[0-9]+$/;

export async function resolveSearch(raw: string): Promise<SearchResult> {
  const q = raw.trim();
  if (!q) return { kind: "not-found", query: raw };

  if (HASH40.test(q)) {
    const a = q.toLowerCase();
    return { kind: "redirect", to: (await isKnownToken(a)) ? `/token/${a}` : `/address/${a}` };
  }

  if (NUMBER.test(q)) {
    return { kind: "redirect", to: `/block/${q}` };
  }

  if (HASH64.test(q)) {
    // a 32-byte hash is ambiguous; the resolver tries tx first, then block, with
    // an rpc fallback that also warms the cold cache.
    const res = await resolveQuery(q);
    if (res.kind === "tx" && res.result.found) {
      return { kind: "redirect", to: `/tx/${q.toLowerCase()}` };
    }
    if (res.kind === "block" && res.result.found) {
      return { kind: "redirect", to: `/block/${q.toLowerCase()}` };
    }
    return { kind: "not-found", query: q };
  }

  // treat as a token name or symbol.
  const tokens = await tokenCollisions(q);
  if (tokens.length === 1) {
    return { kind: "redirect", to: `/token/${tokens[0]!.address}` };
  }
  if (tokens.length > 1) {
    return { kind: "collisions", term: q, tokens };
  }
  return { kind: "not-found", query: q };
}
