// token holders: on-demand hydration plus incremental maintenance.
//
// with a recent-blocks window, a token's transfer history almost always
// predates the window, so holders cannot come from indexed transfers. instead we
// hydrate tokens by pulling their whole Transfer history via chunked eth_getLogs,
// replaying it to a balance set, and storing it in token_balances. after that the
// balances are maintained incrementally from windowed transfers (see
// applyTransferDeltas in db.ts, which only applies deltas for rows actually
// inserted, so a retried range never double applies). hydration is authoritative
// and idempotent (delete then replay), so re-hydrating corrects any drift.
//
// the scan does NOT start at block 1. the deployment block is the floor of a
// token's transfer history, so we start there:
//   1. contracts.creation_block, already indexed for every in-window deployment
//      (free), else
//   2. an eth_getCode binary search (~log2(head) calls) for tokens deployed below
//      the window floor.
// this turns a recent memecoin's hydration from ~1000 empty-history getLogs into
// a handful. the ranges are then fetched CONCURRENTLY (delta accumulation is
// order-independent), and several tokens hydrate in parallel, so one pathological
// token (a genesis-era, millions-of-transfers token like WETH) cannot block the
// queue — the reason nothing was ever written under MODE=both.
//
// the zero address is stored as a real row (mint and burn) and excluded from
// holder counts and top-holder lists at read time.

import { tokenLane } from "./chain.js";
import { sql, insertBatch, ZERO_ADDRESS } from "./db.js";

// holders share the dedicated "tokens" rpc lane with the token metadata worker.
const { getHead, getLogs, rpc } = tokenLane;
import { decodeTransferLog, TRANSFER_TOPIC, type Row } from "./transform.js";
import { log } from "./log.js";

const LOG_CHUNK = Number(process.env.LOG_CHUNK ?? 10_000);
const EAGER_TOP_N = Number(process.env.EAGER_TOP_N ?? 25);
const HOLDERS_IDLE_MS = Number(process.env.HOLDERS_IDLE_MS ?? 4000);
const TOP_HOLDERS_LIMIT = Number(process.env.TOP_HOLDERS_LIMIT ?? 100);
// concurrent getLogs windows in flight per token. paced by the token lane's own
// rate limiter, so this fills the dedicated budget rather than exceeding it.
const HYDRATE_CONCURRENCY = Number(process.env.HYDRATE_CONCURRENCY ?? 12);
// tokens hydrated in parallel. several slots mean one pathological token (a
// genesis-era, millions-of-transfers token like WETH, whose getLogs are
// CU-heavy) grinds in one slot without blocking the cheap tokens draining through
// the others — the reason a single-threaded worker wrote nothing.
const HYDRATION_WORKERS = Number(process.env.HYDRATION_WORKERS ?? 4);
// reclaim a token stuck in 'hydrating' (a crashed/killed worker) after this long,
// so it is retried instead of orphaned forever.
const HYDRATION_STALE_MIN = Number(process.env.HYDRATION_STALE_MIN ?? 20);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const toHexBlock = (n: number): `0x${string}` => `0x${n.toString(16)}`;

// smallest block at which the contract has code, via binary search over eth_getCode
// (archive). the deployment block is a safe lower bound for the transfer history:
// no Transfer can predate the code. ~log2(head) calls, negligible next to the
// getLogs scan it saves. returns 1 if code already exists at block 1.
async function findDeploymentBlock(address: string, head: number): Promise<number> {
  const hasCode = async (b: number): Promise<boolean> => {
    const code = await rpc<string>("eth_getCode", [address, toHexBlock(b)]);
    return code != null && code !== "0x";
  };
  if (await hasCode(1)) return 1;
  // no code even at head (self-destructed or never a contract): nothing to gain,
  // fall back to a full scan from 1 rather than skip history.
  if (!(await hasCode(head))) return 1;
  let lo = 1;
  let hi = head;
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (await hasCode(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

// enqueue a token for hydration and make sure a tokens row exists. safe to call
// on every page request: it never blocks and never re-queues a done token.
export async function requestHydration(address: string): Promise<void> {
  const a = address.toLowerCase();
  // hydration state is tracked in token_hydration only. we do NOT create a
  // tokens row here: the metadata worker treats a bare tokens row as "metadata
  // already attempted", so creating one would stop it ever resolving name/symbol.
  await sql`
    insert into token_hydration (token_address, status)
    values (${a}, 'pending')
    on conflict (token_address) do nothing
  `;
}

interface Replay {
  balances: Map<string, bigint>;
  lastBlock: Map<string, number>;
  transferCount: number;
  firstBlock: number | null;
}

function applyDelta(r: Replay, holder: string, amount: bigint, block: number): void {
  r.balances.set(holder, (r.balances.get(holder) ?? 0n) + amount);
  const prev = r.lastBlock.get(holder);
  if (prev == null || block > prev) r.lastBlock.set(holder, block);
}

// fetch one [lo, hi] window's Transfer logs and fold them into the replay. on a
// provider range/size error, split the window and recurse down to a single block.
// the fold is synchronous (no await between reads and writes of r's maps), so
// concurrent windows never race even though js runs them interleaved.
async function replayWindow(
  address: string,
  lo: number,
  hi: number,
  r: Replay,
): Promise<void> {
  let logs;
  try {
    logs = await getLogs({ address, fromBlock: lo, toBlock: hi, topics: [TRANSFER_TOPIC] });
  } catch (err) {
    // eth_getLogs is capped by block range (this chain: 10000) and sometimes by
    // result count; shrink the window and retry, all the way to a single block.
    if (hi > lo) {
      const mid = Math.floor((lo + hi) / 2);
      await replayWindow(address, lo, mid, r);
      await replayWindow(address, mid + 1, hi, r);
      return;
    }
    throw err;
  }
  for (const lg of logs) {
    const d = decodeTransferLog(lg.topics, lg.data);
    if (!d) continue;
    const block = Number(BigInt(lg.blockNumber));
    r.transferCount += 1;
    if (r.firstBlock == null || block < r.firstBlock) r.firstBlock = block;
    const amount = d.tokenType === "erc721" ? 1n : BigInt(d.value ?? "0");
    if (amount !== 0n) {
      applyDelta(r, d.from, -amount, block);
      applyDelta(r, d.to, amount, block);
    }
  }
}

// replay every Transfer over [from, to], fetching fixed LOG_CHUNK-block windows
// CONCURRENTLY. delta accumulation is order-independent (final balance is a sum,
// first/last block a min/max), so windows may complete in any order. the token
// lane's own rate limiter paces the fan-out, so concurrency fills the dedicated
// budget instead of stalling one 600ms call at a time.
async function replayRange(
  address: string,
  from: number,
  to: number,
  r: Replay,
): Promise<void> {
  if (from > to) return;
  const windows: Array<[number, number]> = [];
  for (let c = from; c <= to; c += LOG_CHUNK) {
    windows.push([c, Math.min(c + LOG_CHUNK - 1, to)]);
  }
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < windows.length) {
      const [lo, hi] = windows[next++]!;
      await replayWindow(address, lo, hi, r);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(HYDRATE_CONCURRENCY, windows.length) }, worker),
  );
}

export async function hydrateToken(address: string): Promise<void> {
  const a = address.toLowerCase();
  await sql`
    insert into token_hydration (token_address, status, started_at)
    values (${a}, 'hydrating', now())
    on conflict (token_address) do update set status = 'hydrating', started_at = now(), error = null
  `;

  try {
    const r: Replay = {
      balances: new Map(),
      lastBlock: new Map(),
      transferCount: 0,
      firstBlock: null,
    };
    // the deployment block is the floor of the transfer history. prefer the
    // indexed creation_block (in-window deploys, free); otherwise binary search
    // eth_getCode. this is what stops every pre-window token scanning ~1000 empty
    // chunks from block 1.
    let head = await getHead();
    const [c] = await sql<{ creation_block: string | null }[]>`
      select creation_block from contracts where address = ${a}
    `;
    const start =
      c?.creation_block != null
        ? Math.max(1, Number(c.creation_block))
        : await findDeploymentBlock(a, head);
    log.info(`hydrating ${a} from block ${start} (head ${head})`);
    await replayRange(a, start, head, r);
    // one reconcile pass to shrink the gap opened while we were reading.
    const head2 = await getHead();
    if (head2 > head) {
      await replayRange(a, head + 1, head2, r);
      head = head2;
    }

    const rows = [...r.balances.entries()].map(([holder, bal]) => ({
      token_address: a,
      holder_address: holder,
      balance: bal.toString(),
      last_updated_block: r.lastBlock.get(holder) ?? head,
    }));

    await sql.begin(async (tx) => {
      // authoritative snapshot: replace any prior balances for this token.
      await tx`delete from token_balances where token_address = ${a}`;
      await insertBatch(
        tx,
        "token_balances",
        ["token_address", "holder_address", "balance", "last_updated_block"],
        rows,
      );
      await tx`
        update token_hydration
           set status = 'done', done_at = now(),
               hydrated_at_block = ${head}, transfer_count = ${r.transferCount}
         where token_address = ${a}
      `;
      await tx`
        insert into token_stats (token_address, transfer_count, first_transfer_block, updated_at)
        values (${a}, ${r.transferCount}, ${r.firstBlock}, now())
        on conflict (token_address) do update
          set transfer_count = excluded.transfer_count,
              first_transfer_block = excluded.first_transfer_block
      `;
    });

    await refreshStats(a);
    log.info(
      `hydrated ${a}: ${r.transferCount} transfers, ${rows.length} balance rows, head ${head}`,
    );
  } catch (err) {
    await sql`
      update token_hydration set status = 'failed', error = ${String(err)}
       where token_address = ${a}
    `;
    log.error(`hydration failed for ${a}: ${String(err)}`);
  }
}

// recompute the balance-derived stats (holder_count, shares) from token_balances.
// transfer_count and first_transfer_block are set at hydration and preserved.
export async function refreshStats(address: string): Promise<void> {
  const a = address.toLowerCase();
  const [agg] = await sql<{ holder_count: string; sum_positive: string }[]>`
    select count(*) filter (where balance > 0 and holder_address <> ${ZERO_ADDRESS}) as holder_count,
           coalesce(sum(balance) filter (where balance > 0 and holder_address <> ${ZERO_ADDRESS}), 0) as sum_positive
      from token_balances where token_address = ${a}
  `;
  const [supplyRow] = await sql<{ total_supply: string | null }[]>`
    select total_supply from tokens where address = ${a}
  `;
  const top = await sql<{ balance: string }[]>`
    select balance from token_balances
     where token_address = ${a} and holder_address <> ${ZERO_ADDRESS} and balance > 0
     order by balance desc limit 10
  `;
  const [dep] = await sql<{ creator: string | null }[]>`
    select creator from contracts where address = ${a}
  `;
  const deployer = dep?.creator ?? null;
  let deployerBal = 0n;
  if (deployer) {
    const [b] = await sql<{ balance: string }[]>`
      select balance from token_balances where token_address = ${a} and holder_address = ${deployer}
    `;
    if (b) deployerBal = BigInt(b.balance);
  }

  const total =
    supplyRow?.total_supply != null && BigInt(supplyRow.total_supply) > 0n
      ? BigInt(supplyRow.total_supply)
      : BigInt(agg?.sum_positive ?? "0");
  const share = (part: bigint): number | null => {
    if (total <= 0n) return null;
    // 6 decimal places of precision, avoiding float overflow on huge supplies.
    return Number((part * 1_000_000n) / total) / 1_000_000;
  };
  const top10 = top.reduce((s, r) => s + BigInt(r.balance), 0n);

  await sql`
    insert into token_stats
      (token_address, holder_count, deployer_address, deployer_balance_share, top10_share, updated_at)
    values (${a}, ${Number(agg?.holder_count ?? 0)}, ${deployer},
            ${share(deployerBal)}, ${share(top10)}, now())
    on conflict (token_address) do update
      set holder_count = excluded.holder_count,
          deployer_address = excluded.deployer_address,
          deployer_balance_share = excluded.deployer_balance_share,
          top10_share = excluded.top10_share,
          updated_at = now()
  `;
}

// enqueue the top tokens by windowed transfer count that are not yet hydrated.
async function eagerEnqueue(): Promise<void> {
  const rows = await sql<{ token_address: string }[]>`
    select tt.token_address
      from token_transfers tt
      left join token_hydration th on th.token_address = tt.token_address
     where th.token_address is null
     group by tt.token_address
     order by count(*) desc
     limit ${EAGER_TOP_N}
  `;
  for (const r of rows) await requestHydration(r.token_address);
}

// atomically claim the oldest pending token: pick it FOR UPDATE SKIP LOCKED and
// flip it to 'hydrating' in one statement, so parallel hydration workers never
// grab the same token.
async function claimNext(): Promise<string | null> {
  const rows = await sql<{ token_address: string }[]>`
    update token_hydration
       set status = 'hydrating', started_at = now()
     where token_address = (
       select token_address from token_hydration
        where status = 'pending'
        order by requested_at
        for update skip locked
        limit 1
     )
     returning token_address
  `;
  return rows[0]?.token_address ?? null;
}

// reclaim tokens left 'hydrating' by a crashed or killed worker: claimNext only
// picks 'pending', so without this an interrupted hydration is orphaned forever
// (the exact state WETH/USDG were found in). a running slot is busy inside
// hydrateToken between claims, so this only ever touches a PREVIOUS worker's
// leftovers, never an in-flight token.
async function reclaimStale(): Promise<void> {
  const reclaimed = await sql`
    update token_hydration set status = 'pending'
     where status = 'hydrating'
       and started_at < now() - ${`${HYDRATION_STALE_MIN} minutes`}::interval
    returning token_address
  `;
  if (reclaimed.length > 0) {
    log.warn(`reclaimed ${reclaimed.length} stale hydrating token(s) back to pending`);
  }
}

export async function runHolders(stopped: () => boolean = () => false): Promise<void> {
  log.info(
    `holders worker started, eager top ${EAGER_TOP_N}, ${HYDRATION_WORKERS} hydration slots x ${HYDRATE_CONCURRENCY} windows`,
  );

  // coordinator: keep the queue fed, reclaim orphaned 'hydrating' rows, and
  // refresh the stalest hydrated token's shares. it never hydrates itself.
  const coordinator = async (): Promise<void> => {
    while (!stopped()) {
      try {
        await reclaimStale();
        await eagerEnqueue();
        const [stale] = await sql<{ token_address: string }[]>`
          select ts.token_address from token_stats ts
          join token_hydration th on th.token_address = ts.token_address
          where th.hydrated_at_block is not null
          order by ts.updated_at asc limit 1
        `;
        if (stale) await refreshStats(stale.token_address);
      } catch (err) {
        log.error(`holders coordinator error: ${String(err)}`);
      }
      await sleep(HOLDERS_IDLE_MS);
    }
  };

  // a hydration slot: claim one token, hydrate it, repeat. several slots run in
  // parallel so a single heavy token cannot block the whole queue.
  const slot = async (): Promise<void> => {
    while (!stopped()) {
      let token: string | null = null;
      try {
        token = await claimNext();
      } catch (err) {
        log.error(`holders claim error: ${String(err)}`);
      }
      if (!token) {
        await sleep(HOLDERS_IDLE_MS);
        continue;
      }
      await hydrateToken(token);
    }
  };

  await Promise.all([
    coordinator(),
    ...Array.from({ length: HYDRATION_WORKERS }, () => slot()),
  ]);
  log.info("holders worker stopped");
}

// ---------------------------------------------------------------------------
// read helpers the frontend calls (never block on hydration)
// ---------------------------------------------------------------------------

export interface Holder {
  holderAddress: string;
  balance: string;
  lastUpdatedBlock: number | null;
}

export interface TokenOverview {
  address: string;
  hydrating: boolean;
  hydratedAtBlock: number | null;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  tokenType: string | null;
  totalSupply: string | null;
  stats: {
    holderCount: number;
    transferCount: number;
    firstTransferBlock: number | null;
    deployerAddress: string | null;
    deployerBalanceShare: number | null;
    top10Share: number | null;
  } | null;
  topHolders: Holder[];
}

export async function getTopHolders(
  address: string,
  limit = TOP_HOLDERS_LIMIT,
): Promise<Holder[]> {
  const a = address.toLowerCase();
  const rows = await sql<{ holder_address: string; balance: string; last_updated_block: string | null }[]>`
    select holder_address, balance, last_updated_block
      from token_balances
     where token_address = ${a} and holder_address <> ${ZERO_ADDRESS} and balance > 0
     order by balance desc limit ${limit}
  `;
  return rows.map((r) => ({
    holderAddress: r.holder_address,
    balance: r.balance,
    lastUpdatedBlock: r.last_updated_block == null ? null : Number(r.last_updated_block),
  }));
}

// token page: triggers hydration lazily, returns what we have plus a hydrating
// flag, never blocks on the hydration itself.
export async function getTokenOverview(address: string): Promise<TokenOverview> {
  const a = address.toLowerCase();
  const [tok] = await sql<Row[]>`select * from tokens where address = ${a}`;
  const [hyd] = await sql<{ status: string; hydrated_at_block: string | null }[]>`
    select status, hydrated_at_block from token_hydration where token_address = ${a}
  `;
  const [st] = await sql<Row[]>`select * from token_stats where token_address = ${a}`;

  const hydrated = hyd?.hydrated_at_block != null;
  const hydrating = !hydrated;
  if (!hydrated && hyd?.status !== "hydrating") await requestHydration(a);

  return {
    address: a,
    hydrating,
    hydratedAtBlock: hyd?.hydrated_at_block == null ? null : Number(hyd.hydrated_at_block),
    name: (tok?.name as string | null) ?? null,
    symbol: (tok?.symbol as string | null) ?? null,
    decimals: tok?.decimals == null ? null : Number(tok.decimals),
    tokenType: (tok?.token_type as string | null) ?? null,
    totalSupply: tok?.total_supply == null ? null : String(tok.total_supply),
    stats: st
      ? {
          holderCount: Number(st.holder_count),
          transferCount: Number(st.transfer_count),
          firstTransferBlock: st.first_transfer_block == null ? null : Number(st.first_transfer_block),
          deployerAddress: (st.deployer_address as string | null) ?? null,
          deployerBalanceShare: st.deployer_balance_share == null ? null : Number(st.deployer_balance_share),
          top10Share: st.top10_share == null ? null : Number(st.top10_share),
        }
      : null,
    topHolders: hydrated ? await getTopHolders(a) : [],
  };
}

export interface NewToken {
  address: string;
  creator: string | null;
  creationTx: string | null;
  creationBlock: number | null;
  name: string | null;
  symbol: string | null;
}

// new token feed: contract deployments newest first, token metadata joined. a
// deployment is a tx with no `to` whose receipt carried a contract_address.
export async function newTokens(limit = 50, sinceBlock?: number): Promise<NewToken[]> {
  const rows = await sql<Row[]>`
    select c.address, c.creator, c.creation_tx, c.creation_block, t.name, t.symbol
      from contracts c
      left join tokens t on t.address = c.address
     where c.creation_block is not null
       ${sinceBlock != null ? sql`and c.creation_block >= ${sinceBlock}` : sql``}
     order by c.creation_block desc
     limit ${limit}
  `;
  return rows.map((r) => ({
    address: r.address as string,
    creator: (r.creator as string | null) ?? null,
    creationTx: (r.creation_tx as string | null) ?? null,
    creationBlock: r.creation_block == null ? null : Number(r.creation_block),
    name: (r.name as string | null) ?? null,
    symbol: (r.symbol as string | null) ?? null,
  }));
}

// everything a deployer has launched.
export async function deployerTokens(deployer: string, limit = 50): Promise<NewToken[]> {
  const d = deployer.toLowerCase();
  const rows = await sql<Row[]>`
    select c.address, c.creator, c.creation_tx, c.creation_block, t.name, t.symbol
      from contracts c
      left join tokens t on t.address = c.address
     where c.creator = ${d}
     order by c.creation_block desc nulls last
     limit ${limit}
  `;
  return rows.map((r) => ({
    address: r.address as string,
    creator: (r.creator as string | null) ?? null,
    creationTx: (r.creation_tx as string | null) ?? null,
    creationBlock: r.creation_block == null ? null : Number(r.creation_block),
    name: (r.name as string | null) ?? null,
    symbol: (r.symbol as string | null) ?? null,
  }));
}
