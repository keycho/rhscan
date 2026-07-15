// postgres.js connection and insert helpers.
//
// DATABASE_URL is a secret (supabase), env only. window writes go to the
// range-partitioned tables plus the tiny tx_locations / block_locations maps;
// cold writes (rpc lookups below the window) go to the unpartitioned cold_*
// tables. every insert is on conflict do nothing, so overlap between workers and
// re-processing after a crash are both safe. inserts are chunked to stay under
// postgres' 65535 bind-parameter limit.

import postgres from "postgres";
import { log } from "./log.js";
import { COLUMNS, type BlockRows } from "./transform.js";

// the indexer is one long-running process on supabase's SESSION pooler: every
// worker (backfill, tail, tokens, holders, pruner, partition maintainer) shares
// this pool, so the process opens at most PG_POOL_MAX connections total, not a
// pool per worker. keep it well under supabase's session-pooler client cap (15):
// against the pooler set PG_POOL_MAX=5. default 10.
const PG_POOL_MAX = Number(process.env.PG_POOL_MAX ?? 10);

// web vs indexer connection profile. the web app runs on vercel as short-lived
// serverless functions against supabase's TRANSACTION pooler (port 6543,
// pgbouncer transaction mode); the indexer is a long-running process on the
// SESSION pooler. select explicitly with DB_MODE=web|indexer; when unset, a
// next.js server runtime (NEXT_RUNTIME set) is treated as web and everything
// else as indexer.
function isWebMode(): boolean {
  const mode = process.env.DB_MODE;
  if (mode === "web") return true;
  if (mode === "indexer") return false;
  return Boolean(process.env.NEXT_RUNTIME);
}

// the pool is created lazily on first use, not at module import. `next build`'s
// "collect page data" phase imports every route module (even force-dynamic ones
// that never render at build), so creating the pool — or throwing on a missing
// DATABASE_URL — at import time would fail the build. all db-backed routes are
// force-dynamic and run no query during build, so nothing here is touched until
// a real request queries. a missing DATABASE_URL still fails loudly, at the
// first query rather than at import.
let pool: postgres.Sql | null = null;
function connect(): postgres.Sql {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set, see .env.example");
  // web: one connection per function instance and NO prepared statements — the
  // transaction pooler multiplexes a connection per statement and rejects
  // prepared statements, which surfaces as CONNECTION_CLOSED; a pool of 10 per
  // instance exhausts the pooler and surfaces as ECHECKOUTTIMEOUT. a short idle
  // timeout releases the connection back to the pooler quickly between requests.
  // indexer: a real pool with prepared statements on the session pooler.
  pool = isWebMode()
    ? postgres(url, {
        max: 1,
        prepare: false,
        idle_timeout: 10,
        connect_timeout: 15,
        onnotice: () => {},
      })
    : postgres(url, {
        max: PG_POOL_MAX,
        idle_timeout: 30,
        connect_timeout: 15,
        onnotice: () => {},
      });
  return pool;
}

// a lazy proxy over the pool. tagged-template calls (sql`...`) hit `apply`;
// method/property access (sql.begin, sql.end, sql.unsafe) hits `get`. neither
// trap fires at import, so this module is import-safe without a live
// DATABASE_URL; the pool connects on the first query.
export const sql: postgres.Sql = new Proxy(function () {} as unknown as postgres.Sql, {
  apply(_target, _thisArg, args: unknown[]) {
    return (connect() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_target, prop) {
    if (prop === "then") return undefined; // never look thenable
    const p = connect() as unknown as Record<PropertyKey, unknown>;
    const value = p[prop];
    return typeof value === "function"
      ? (value as (...a: unknown[]) => unknown).bind(p)
      : value;
  },
});

export type Executor = postgres.Sql | postgres.TransactionSql;

const MAX_BIND_PARAMS = 60_000;
const ZERO_ADDRESS = "0x" + "0".repeat(40);

export async function insertBatch(
  exec: Executor,
  table: string,
  columns: readonly string[],
  rows: readonly Record<string, unknown>[],
): Promise<void> {
  if (rows.length === 0) return;
  const chunkSize = Math.max(1, Math.floor(MAX_BIND_PARAMS / columns.length));
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await exec`insert into ${exec(table)} ${exec(
      chunk as Record<string, unknown>[],
      ...(columns as string[]),
    )} on conflict do nothing`;
  }
}

// like insertBatch but returns the rows actually inserted (conflicts excluded).
// this is how balance deltas avoid double-applying on a retried range.
async function insertBatchReturning(
  exec: Executor,
  table: string,
  columns: readonly string[],
  rows: readonly Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  if (rows.length === 0) return [];
  const chunkSize = Math.max(1, Math.floor(MAX_BIND_PARAMS / columns.length));
  const inserted: Record<string, unknown>[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const got = await exec`insert into ${exec(table)} ${exec(
      chunk as Record<string, unknown>[],
      ...(columns as string[]),
    )} on conflict do nothing returning *`;
    inserted.push(...(got as unknown as Record<string, unknown>[]));
  }
  return inserted;
}

// apply erc-20/721 balance deltas for token_transfers that were ACTUALLY
// inserted, and only for tokens already hydrated and only for blocks past the
// hydration point. deltas are computed from the returned rows, never from the
// input array, so a retried backfill range (all conflicts, nothing returned)
// applies nothing. mint/burn (zero address) is stored as a real row and filtered
// at read time.
async function applyTransferDeltas(
  exec: Executor,
  inserted: Record<string, unknown>[],
): Promise<void> {
  if (inserted.length === 0) return;
  const tokenAddrs = [...new Set(inserted.map((r) => String(r.token_address)))];
  // hydration state lives in token_hydration, not tokens, so it never collides
  // with the metadata worker's "bare row means already attempted" invariant.
  const hydrated = await exec<{ token_address: string; hydrated_at_block: string }[]>`
    select token_address, hydrated_at_block from token_hydration
     where token_address in ${exec(tokenAddrs)}
       and status = 'done' and hydrated_at_block is not null
  `;
  if (hydrated.length === 0) return;
  const hydatedAt = new Map(hydrated.map((h) => [h.token_address, Number(h.hydrated_at_block)]));

  // key: token|holder -> accumulated delta and latest block
  const deltas = new Map<string, { token: string; holder: string; delta: bigint; block: number }>();
  const bump = (token: string, holder: string, delta: bigint, block: number) => {
    const key = `${token}|${holder}`;
    const cur = deltas.get(key);
    if (cur) {
      cur.delta += delta;
      if (block > cur.block) cur.block = block;
    } else {
      deltas.set(key, { token, holder, delta, block });
    }
  };

  for (const r of inserted) {
    const token = String(r.token_address);
    const hb = hydatedAt.get(token);
    if (hb == null) continue;
    const block = Number(r.block_number);
    if (block <= hb) continue; // already counted by hydration
    const amount = r.token_type === "erc721" ? 1n : BigInt(String(r.value ?? "0"));
    if (amount === 0n) continue;
    bump(token, String(r.from_address), -amount, block);
    bump(token, String(r.to_address), amount, block);
  }
  if (deltas.size === 0) return;

  const rows = [...deltas.values()].map((d) => ({
    token_address: d.token,
    holder_address: d.holder,
    balance: d.delta.toString(),
    last_updated_block: d.block,
  }));
  const chunkSize = Math.max(1, Math.floor(MAX_BIND_PARAMS / 4));
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await exec`
      insert into token_balances ${exec(
        chunk,
        "token_address",
        "holder_address",
        "balance",
        "last_updated_block",
      )}
      on conflict (token_address, holder_address) do update
        set balance = token_balances.balance + excluded.balance,
            last_updated_block = greatest(token_balances.last_updated_block, excluded.last_updated_block)
    `;
  }
}

const flat = <K extends keyof BlockRows>(blocks: readonly BlockRows[], k: K) =>
  blocks.flatMap((b) => b[k] as Record<string, unknown>[]);

// window write: partitioned tables + the hash->block_number maps, all in one
// transaction. balance deltas are applied for the transfers actually inserted.
export async function writeBlocks(
  exec: Executor,
  blocks: readonly BlockRows[],
): Promise<void> {
  if (blocks.length === 0) return;
  const blks = blocks.map((b) => b.block);
  const txns = flat(blocks, "transactions");

  await insertBatch(exec, "blocks", COLUMNS.blocks, blks);
  await insertBatch(exec, "transactions", COLUMNS.transactions, txns);
  await insertBatch(exec, "logs", COLUMNS.logs, flat(blocks, "logs"));
  const insertedTransfers = await insertBatchReturning(
    exec,
    "token_transfers",
    COLUMNS.token_transfers,
    flat(blocks, "tokenTransfers"),
  );
  await insertBatch(exec, "address_transactions", COLUMNS.address_transactions, flat(blocks, "addressTxns"));
  await insertBatch(exec, "contracts", COLUMNS.contracts, flat(blocks, "contracts"));

  await insertBatch(
    exec,
    "tx_locations",
    ["hash", "block_number"],
    txns.map((t) => ({ hash: t.hash, block_number: t.block_number })),
  );
  await insertBatch(
    exec,
    "block_locations",
    ["hash", "block_number"],
    blks.map((b) => ({ hash: b.hash, block_number: b.number })),
  );

  await applyTransferDeltas(exec, insertedTransfers);
}

// cold write: the unpartitioned cold_* cache, a different lifecycle from the
// window, never pruned. contracts is shared metadata.
export async function writeColdBlocks(
  exec: Executor,
  blocks: readonly BlockRows[],
): Promise<void> {
  if (blocks.length === 0) return;
  await insertBatch(exec, "cold_blocks", COLUMNS.blocks, blocks.map((b) => b.block));
  await insertBatch(exec, "cold_transactions", COLUMNS.transactions, flat(blocks, "transactions"));
  await insertBatch(exec, "cold_logs", COLUMNS.logs, flat(blocks, "logs"));
  await insertBatch(exec, "cold_token_transfers", COLUMNS.token_transfers, flat(blocks, "tokenTransfers"));
  await insertBatch(exec, "cold_address_transactions", COLUMNS.address_transactions, flat(blocks, "addressTxns"));
  await insertBatch(exec, "contracts", COLUMNS.contracts, flat(blocks, "contracts"));
}

export { ZERO_ADDRESS };

export async function closeDb(): Promise<void> {
  if (!pool) return; // nothing ever connected
  try {
    await pool.end({ timeout: 5 });
  } catch (err) {
    log.warn(`error closing db: ${String(err)}`);
  }
}
