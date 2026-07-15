// token metadata worker.
//
// resolves name/symbol/decimals/totalSupply via multicall3 (confirmed deployed
// on this chain) for every token missing metadata, from two sources:
//
//   1. addresses seen in token_transfers that have no tokens row yet (newly
//      discovered tokens), and
//   2. existing tokens rows whose name/symbol/decimals/total_supply are still
//      null — rows that predate a working worker, or that were only ever seeded
//      with address + token_type.
//
// metadata_fetched_at records that an attempt was made. it is set on EVERY pass,
// whether or not the contract answered, so a contract that does not implement
// name()/symbol() is attempted once and then skipped — not re-hammered forever.
// a token that later needs a fresh look can be re-queued by clearing the column,
// or the whole missing-metadata set can be re-attempted with TOKENS_FORCE_REFRESH.

import { erc20Abi } from "viem";
import { metadataLane, MULTICALL3_ADDRESS } from "./chain.js";
import { sql } from "./db.js";

// the metadata worker runs at LOW priority on the global rpc budget, so it never
// takes throughput the tail needs to keep up with the head (see chain.ts).
const { multicall } = metadataLane;
import { log } from "./log.js";

// keep the batch small: draining a large missing-metadata backlog is a
// background trickle, not a race. a small batch bounds the size of each discovery
// scan and upsert so a single pass can never spike db load.
const TOKENS_BATCH = Number(process.env.TOKENS_BATCH ?? 25);
const TOKENS_IDLE_MS = Number(process.env.TOKENS_IDLE_MS ?? 5000);
// pause between batches even when there is more backlog to drain. this rate-limits
// the backlog drain itself (not just the rpc calls): a big backlog is worked off
// slowly over time instead of back-to-back, so the indexer never overloads the
// shared database and times out the site. raise it to drain more gently, lower it
// to drain faster.
const TOKENS_BATCH_DELAY_MS = Number(process.env.TOKENS_BATCH_DELAY_MS ?? 2000);
// re-attempt every row missing metadata even if it was attempted before. off by
// default so contracts with no metadata methods are not re-hammered each pass.
const TOKENS_FORCE_REFRESH = (process.env.TOKENS_FORCE_REFRESH ?? "false") === "true";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Unknown {
  address: string;
  token_type: string | null;
}

// tokens needing metadata: existing rows whose fields are still null (the
// backfill of pre-existing "unnamed" tokens), plus token_transfers addresses
// with no row yet (newly discovered tokens). existing rows are attempted once
// (metadata_fetched_at null) unless TOKENS_FORCE_REFRESH re-opens the whole set.
async function nextUnknownTokens(): Promise<Unknown[]> {
  const attemptGate = TOKENS_FORCE_REFRESH ? sql`true` : sql`t.metadata_fetched_at is null`;
  return sql<Unknown[]>`
    (
      select t.address, t.token_type
        from tokens t
       where ${attemptGate}
         and (t.name is null or t.symbol is null
              or t.decimals is null or t.total_supply is null)
       limit ${TOKENS_BATCH}
    )
    union all
    (
      select distinct on (tt.token_address)
             tt.token_address as address, tt.token_type
        from token_transfers tt
        left join tokens t on t.address = tt.token_address
       where t.address is null
       limit ${TOKENS_BATCH}
    )
    limit ${TOKENS_BATCH}
  `;
}

type Result<T> = { status: "success"; result: T } | { status: "failure" };

function ok<T>(r: Result<unknown> | undefined): T | null {
  return r && r.status === "success" ? (r.result as T) : null;
}

async function resolveBatch(tokens: Unknown[]): Promise<number> {
  const contracts = tokens.flatMap((t) => {
    const address = t.address as `0x${string}`;
    return [
      { address, abi: erc20Abi, functionName: "name" } as const,
      { address, abi: erc20Abi, functionName: "symbol" } as const,
      { address, abi: erc20Abi, functionName: "decimals" } as const,
      { address, abi: erc20Abi, functionName: "totalSupply" } as const,
    ];
  });

  const results = (await multicall({
    contracts,
    allowFailure: true,
    multicallAddress: MULTICALL3_ADDRESS,
  })) as Result<unknown>[];

  let resolved = 0;
  const rows = tokens.map((t, i) => {
    const base = i * 4;
    const name = sanitize(ok<string>(results[base]));
    const symbol = sanitize(ok<string>(results[base + 1]));
    const decimals = ok<number | bigint>(results[base + 2]);
    const totalSupply = ok<bigint>(results[base + 3]);
    if (name != null || symbol != null || decimals != null || totalSupply != null) resolved += 1;
    return {
      address: t.address,
      name,
      symbol,
      decimals: decimals == null ? null : Number(decimals),
      token_type: t.token_type,
      total_supply: totalSupply == null ? null : totalSupply.toString(),
    };
  });

  // upsert: insert new rows, and fill in missing metadata on existing ones. every
  // field uses coalesce(excluded, existing) so a value we DID resolve is written
  // while a value the contract did not return this pass never clobbers a good one
  // already stored. metadata_fetched_at is always advanced to now(), which is
  // what moves a row out of the "needs metadata / never attempted" scan.
  await sql`
    insert into tokens ${sql(
      rows,
      "address",
      "name",
      "symbol",
      "decimals",
      "token_type",
      "total_supply",
    )}
    on conflict (address) do update set
      name                = coalesce(excluded.name, tokens.name),
      symbol              = coalesce(excluded.symbol, tokens.symbol),
      decimals            = coalesce(excluded.decimals, tokens.decimals),
      token_type          = coalesce(excluded.token_type, tokens.token_type),
      total_supply        = coalesce(excluded.total_supply, tokens.total_supply),
      metadata_fetched_at = now()
  `;
  return resolved;
}

// drop control characters some tokens pack into their name/symbol strings, and
// cap length so a hostile token cannot bloat a row.
function sanitize(s: string | null): string | null {
  if (s == null) return null;
  let out = "";
  for (const ch of s) {
    if ((ch.codePointAt(0) ?? 0) >= 0x20) out += ch;
  }
  out = out.trim();
  return out.length ? out.slice(0, 256) : null;
}

export async function runTokens(stopped: () => boolean = () => false): Promise<void> {
  log.info(
    `token metadata worker started, batch ${TOKENS_BATCH}, ` +
      `batch delay ${TOKENS_BATCH_DELAY_MS}ms` +
      (TOKENS_FORCE_REFRESH ? " (force refresh)" : ""),
  );
  while (!stopped()) {
    try {
      const tokens = await nextUnknownTokens();
      if (tokens.length === 0) {
        await sleep(TOKENS_IDLE_MS);
        continue;
      }
      const resolved = await resolveBatch(tokens);
      log.info(`token metadata: attempted ${tokens.length}, resolved ${resolved}`);
      // pause between batches so a large backlog drains as a slow trickle rather
      // than back-to-back queries + upserts that overload the shared db.
      await sleep(TOKENS_BATCH_DELAY_MS);
    } catch (err) {
      log.error(`token metadata batch failed, backing off: ${String(err)}`);
      await sleep(TOKENS_IDLE_MS);
    }
  }
  log.info("token metadata worker stopped");
}
