// viem chain definition and rpc client for robinhood chain (4663).
//
// robinhood chain is an arbitrum orbit l2, so blocks, transactions and
// receipts carry extra fields (l1BlockNumber, gasUsedForL1, effectiveGasPrice)
// that viem's default formatters would drop. we attach arbitrum-style
// formatters so those fields survive typed calls, and the backfill hot path
// additionally reads raw json-rpc (see rpc() below) so nothing is ever lost.

import {
  createPublicClient,
  defineChain,
  defineBlock,
  defineTransaction,
  defineTransactionReceipt,
  http,
} from "viem";
import { log } from "./log.js";
import type { RawBlock, RawReceipt, RawTx } from "./transform.js";

export const CHAIN_ID = 4663;

// canonical multicall3, confirmed deployed on this chain.
export const MULTICALL3_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11" as const;

const PUBLIC_RPC = "https://rpc.mainnet.chain.robinhood.com";

export const RPC_URL = process.env.RPC_URL ?? PUBLIC_RPC;
if (!process.env.RPC_URL) {
  log.warn(
    "RPC_URL is not set, falling back to the public rate-limited endpoint. do not backfill against it.",
  );
}

// keep the arbitrum-only fields when viem parses a block/tx/receipt.
const formatters = {
  block: defineBlock({
    format(args: { l1BlockNumber?: `0x${string}` | null }) {
      return {
        l1BlockNumber:
          args.l1BlockNumber != null ? BigInt(args.l1BlockNumber) : undefined,
      };
    },
  }),
  transaction: defineTransaction({
    format(args: {
      gasUsedForL1?: `0x${string}` | null;
      l1BlockNumber?: `0x${string}` | null;
    }) {
      return {
        gasUsedForL1:
          args.gasUsedForL1 != null ? BigInt(args.gasUsedForL1) : undefined,
        l1BlockNumber:
          args.l1BlockNumber != null ? BigInt(args.l1BlockNumber) : undefined,
      };
    },
  }),
  transactionReceipt: defineTransactionReceipt({
    format(args: {
      l1BlockNumber?: `0x${string}` | null;
      gasUsedForL1?: `0x${string}` | null;
    }) {
      return {
        l1BlockNumber:
          args.l1BlockNumber != null ? BigInt(args.l1BlockNumber) : undefined,
        gasUsedForL1:
          args.gasUsedForL1 != null ? BigInt(args.gasUsedForL1) : undefined,
      };
    },
  }),
};

export const rhChain = defineChain({
  id: CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  contracts: {
    multicall3: { address: MULTICALL3_ADDRESS, blockCreated: 0 },
  },
  formatters,
});

// batch is the single biggest throughput lever: viem packs every request made
// through a client (raw rpc() calls and multicall alike) into json-rpc batches.
// we handle retry/backoff ourselves in rpc(), so the transport does not retry.
const BATCH_WAIT = Number(process.env.BATCH_WAIT ?? 20);
// cap the json-rpc batch size hard. alchemy counts EACH call inside a batch
// against the rate limit, not each http request, so an uncapped batch of
// hundreds is a single burst that trips 429s well under the nominal req/s
// ceiling. small batches spread the same calls across more requests and windows.
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 20);
const RPC_TIMEOUT_MS = Number(process.env.RPC_TIMEOUT_MS ?? 30_000);
const MAX_RPC_ATTEMPTS = Number(process.env.MAX_RPC_ATTEMPTS ?? 8);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRateLimitError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("-32005") || // json-rpc limit exceeded
    msg.includes("exceeded") ||
    msg.includes("capacity") ||
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("socket hang up") ||
    msg.includes("fetch failed") ||
    // a rate-limited batch often comes back as a malformed / short body that
    // viem cannot line up with the requests. treat those as transient too.
    msg.includes("an unknown rpc error") ||
    msg.includes("cannot read properties") ||
    msg.includes("service unavailable") ||
    msg.includes("bad gateway") ||
    msg.includes("gateway timeout")
  );
}

const toHex = (n: number): `0x${string}` => `0x${n.toString(16)}`;

// alchemy meters per json-rpc CALL (not per http request) and enforces a req/s
// ceiling on the api key. capping viem's batch size does not help — it just
// splits the same burst of calls across more http requests. the real lever is a
// token-bucket rate limiter that paces call issuance to just under the ceiling.
// every lane shares one api key, so ONE global limiter governs them all; the
// per-lane clients only isolate batch queues and backoff, not the budget.
//
// the limiter counts json-rpc CALLS, not http requests: one token is drawn per
// rpc() call (see below), so a batched http request carrying 20 calls draws 20
// tokens — which is exactly how alchemy meters.
//
// alchemy meters COMPUTE UNITS per second, not raw requests, and
// eth_getBlockReceipts (the backfill hot path) is CU-heavy. measured against the
// pay-as-you-go endpoint over full minutes: ~40 calls/s (a getBlockByNumber +
// getBlockReceipts per block, ~20 blocks/s) sustains with ZERO 429s, while ~60+
// calls/s draws a steady 429 stream and collapses throughput. a short raw-fetch
// burst can go higher, but that only rides alchemy's momentary CU bucket, not the
// sustained rate. so the default is 40, NOT the endpoint's nominal "300 req/s"
// (that figure only holds for cheap calls). raise RPC_RATE_LIMIT if you buy more
// CU/s. the bucket refills at RPC_RATE_LIMIT tokens/sec, capped at RPC_RATE_BURST;
// keep the burst small so issuance stays smooth (bursts spike CU and draw 429s).
const RPC_RATE_LIMIT = Number(process.env.RPC_RATE_LIMIT ?? 40);
const RPC_RATE_BURST = Number(process.env.RPC_RATE_BURST ?? 10);

class RateLimiter {
  private tokens: number;
  private last = Date.now();
  private readonly waiters: Array<() => void> = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly rate: number,
    private readonly capacity: number,
  ) {
    this.tokens = capacity;
  }

  acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.waiters.push(resolve);
      this.pump();
    });
  }

  // release as many queued waiters as there are tokens, then arm ONE timer for
  // the next release. a single shared timer (not a sleep-and-repoll per waiter)
  // keeps this O(1) even with thousands of callers queued, so a fan-out of range
  // fetches can never thrash the event loop — the earlier polling design did, and
  // the starvation showed up as spurious request failures under high concurrency.
  private pump(): void {
    const now = Date.now();
    this.tokens = Math.min(
      this.capacity,
      this.tokens + ((now - this.last) / 1000) * this.rate,
    );
    this.last = now;
    while (this.tokens >= 1 && this.waiters.length > 0) {
      this.tokens -= 1;
      this.waiters.shift()!();
    }
    if (this.waiters.length > 0 && this.timer == null) {
      const waitMs = Math.max(1, Math.ceil(((1 - this.tokens) / this.rate) * 1000));
      this.timer = setTimeout(() => {
        this.timer = null;
        this.pump();
      }, waitMs);
    }
  }
}

// one global budget for the whole api key, shared across every lane.
const limiter = new RateLimiter(RPC_RATE_LIMIT, RPC_RATE_BURST);

export interface RpcLog {
  address: `0x${string}`;
  topics: `0x${string}`[];
  data: `0x${string}`;
  blockNumber: `0x${string}`;
  logIndex: `0x${string}`;
  transactionHash: `0x${string}`;
}

// an rpc lane is a viem client plus every typed helper bound to it. each worker
// class gets its own lane so their batch queues and in-flight budgets are
// independent: backfill's burst never merges into tail's or the token workers'
// batches, and one lane backing off on 429s does not stall another. observed
// 429s are logged with the lane label so the culprit is obvious.
export function createRpcLane(label: string) {
  const client = createPublicClient({
    chain: rhChain,
    transport: http(RPC_URL, {
      batch: { wait: BATCH_WAIT, batchSize: BATCH_SIZE },
      timeout: RPC_TIMEOUT_MS,
      retryCount: 0,
    }),
  });

  // raw batched json-rpc with exponential backoff and jitter on rate-limit and
  // transient network errors. non-transient errors throw immediately. every
  // attempt (including retries) draws one token from the global limiter first,
  // so the token count equals the json-rpc call count that alchemy meters.
  async function rpc<T>(method: string, params: unknown[]): Promise<T> {
    let attempt = 0;
    for (;;) {
      await limiter.acquire();
      try {
        return (await client.request({
          method: method as never,
          params: params as never,
        })) as T;
      } catch (err) {
        attempt += 1;
        if (attempt >= MAX_RPC_ATTEMPTS || !isRateLimitError(err)) {
          throw err;
        }
        // with the limiter pacing issuance, 429s should be rare; when one slips
        // through, back off gently rather than stalling the whole range.
        const backoff = Math.min(200 * 2 ** attempt, 8_000);
        const jitter = Math.floor(Math.random() * backoff * 0.5);
        const wait = backoff + jitter;
        log.warn(
          `[${label}] rpc ${method} rate limited, retry ${attempt}/${MAX_RPC_ATTEMPTS} in ${wait}ms`,
        );
        await sleep(wait);
      }
    }
  }

  return {
    label,
    client,
    rpc,
    getHead: async (): Promise<number> =>
      Number(BigInt(await rpc<`0x${string}`>("eth_blockNumber", []))),
    // eth_getBlockByNumber with full transactions gives per-tx fields (value,
    // nonce, calldata, fee caps); eth_getBlockReceipts gives execution results
    // and logs in one call. both go through the batched transport.
    getBlockByNumber: (n: number): Promise<RawBlock> =>
      rpc<RawBlock>("eth_getBlockByNumber", [toHex(n), true]),
    getBlockReceipts: (n: number): Promise<RawReceipt[]> =>
      rpc<RawReceipt[]>("eth_getBlockReceipts", [toHex(n)]),
    // eth_getBlockByNumber can return null for an unknown number; getBlockByNumber
    // assumes it exists (hot path), this variant tolerates a miss.
    getBlockByNumberOrNull: (n: number): Promise<RawBlock | null> =>
      rpc<RawBlock | null>("eth_getBlockByNumber", [toHex(n), true]),
    getBlockByHash: (hash: string, full = true): Promise<RawBlock | null> =>
      rpc<RawBlock | null>("eth_getBlockByHash", [hash, full]),
    // cold-path reads: single tx / block / account lookups for data below the
    // window. these are not batched hot-path calls, they serve one user query.
    getTransactionByHash: (hash: string): Promise<RawTx | null> =>
      rpc<RawTx | null>("eth_getTransactionByHash", [hash]),
    getTransactionReceipt: (hash: string): Promise<RawReceipt | null> =>
      rpc<RawReceipt | null>("eth_getTransactionReceipt", [hash]),
    getBalance: (address: string): Promise<`0x${string}`> =>
      rpc<`0x${string}`>("eth_getBalance", [address, "latest"]),
    getTransactionCount: (address: string): Promise<`0x${string}`> =>
      rpc<`0x${string}`>("eth_getTransactionCount", [address, "latest"]),
    getCode: (address: string): Promise<`0x${string}`> =>
      rpc<`0x${string}`>("eth_getCode", [address, "latest"]),
    // eth_getLogs for one address over a block range, one topic filter. used by
    // token hydration to pull a token's whole Transfer history in chunks.
    getLogs: (params: {
      address: string;
      fromBlock: number;
      toBlock: number;
      topics?: (string | null)[];
    }): Promise<RpcLog[]> =>
      rpc<RpcLog[]>("eth_getLogs", [
        {
          address: params.address,
          fromBlock: toHex(params.fromBlock),
          toBlock: toHex(params.toBlock),
          ...(params.topics ? { topics: params.topics } : {}),
        },
      ]),
  };
}

export type RpcLane = ReturnType<typeof createRpcLane>;

// one lane per worker class, so no two share a rate-limit budget or batch queue.
export const backfillLane = createRpcLane("backfill");
export const tailLane = createRpcLane("tail");
// the token metadata worker, holder hydration, and verify:balances all run in
// the same "tokens" budget.
export const tokenLane = createRpcLane("tokens");
// the on-demand cold-path resolver and one-off cli reads.
export const coldLane = createRpcLane("cold");

// default-lane re-exports so the resolver and misc callers stay unchanged.
export const client = coldLane.client;
export const rpc = coldLane.rpc;
export const getHead = coldLane.getHead;
export const getBlockByNumber = coldLane.getBlockByNumber;
export const getBlockReceipts = coldLane.getBlockReceipts;
export const getBlockByNumberOrNull = coldLane.getBlockByNumberOrNull;
export const getBlockByHash = coldLane.getBlockByHash;
export const getTransactionByHash = coldLane.getTransactionByHash;
export const getTransactionReceipt = coldLane.getTransactionReceipt;
export const getBalance = coldLane.getBalance;
export const getTransactionCount = coldLane.getTransactionCount;
export const getCode = coldLane.getCode;
export const getLogs = coldLane.getLogs;
