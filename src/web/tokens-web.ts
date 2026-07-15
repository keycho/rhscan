// token reads specific to the web app: the name-collision list, the "others share
// this name" note, the token transfer feed, the tokens landing lists, and an
// address's token holdings.
//
// the collision reads match on lower(name)/lower(symbol), served by the
// functional indexes added in migration 0003 (an index read, not a scan over the
// unbounded tokens table). facts only: we surface deployment, deployer, holders,
// transfers and top-10 concentration for every colliding contract and let the
// reader judge. no scores, no risk labels.

import { sql } from "../db.js";

export interface TokenCard {
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  tokenType: string | null;
  totalSupply: string | null;
  holderCount: number | null;
  transferCount: number | null;
  firstTransferBlock: number | null;
  top10Share: number | null;
  deployer: string | null;
  creationBlock: number | null;
  creationTx: string | null;
  creationTime: string | null;
  // transfers seen inside the indexed window. a live signal that is present even
  // before a token is hydrated (transferCount, holderCount and top10Share all
  // come from hydration and are null until then). on a windowed index the hot and
  // colliding tokens are usually deployed before the window, so without this the
  // collision cards would be all dashes on first view.
  windowedTransfers: number | null;
}

// a lazy fragment — a function, not a top-level `sql` call — so importing this
// module never touches the db. `next build` collects page data for the
// db-backed (force-dynamic) routes without a live DATABASE_URL; the fragment is
// only built when a query actually runs. shared column list for a token card.
const cardColumns = () => sql`
  t.address, t.name, t.symbol, t.decimals, t.token_type, t.total_supply,
  ts.holder_count, ts.transfer_count, ts.first_transfer_block, ts.top10_share,
  coalesce(ts.deployer_address, c.creator) as deployer,
  c.creation_block, c.creation_tx,
  coalesce(b.timestamp, cb.timestamp) as creation_time
`;

type CardRow = {
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  token_type: string | null;
  total_supply: string | null;
  holder_count: string | null;
  transfer_count: string | null;
  first_transfer_block: string | null;
  top10_share: string | null;
  deployer: string | null;
  creation_block: string | null;
  creation_tx: string | null;
  creation_time: Date | null;
};

function toCard(r: CardRow): TokenCard {
  return {
    address: r.address,
    name: r.name,
    symbol: r.symbol,
    decimals: r.decimals == null ? null : Number(r.decimals),
    tokenType: r.token_type,
    totalSupply: r.total_supply == null ? null : String(r.total_supply),
    holderCount: r.holder_count == null ? null : Number(r.holder_count),
    transferCount: r.transfer_count == null ? null : Number(r.transfer_count),
    firstTransferBlock: r.first_transfer_block == null ? null : Number(r.first_transfer_block),
    top10Share: r.top10_share == null ? null : Number(r.top10_share),
    deployer: r.deployer,
    creationBlock: r.creation_block == null ? null : Number(r.creation_block),
    creationTx: r.creation_tx,
    creationTime: r.creation_time == null ? null : new Date(r.creation_time).toISOString(),
    windowedTransfers: null,
  };
}

// attach the windowed transfer count for each card (one grouped read over the
// bounded card set), and optionally re-rank by the best activity signal we have:
// all-time transfer count when hydrated, else windowed. `resort` is off for the
// new-token feed, which must stay newest-first.
async function attachWindowed(cards: TokenCard[], resort = true): Promise<TokenCard[]> {
  if (cards.length === 0) return cards;
  const addrs = cards.map((c) => c.address);
  const rows = await sql<{ token_address: string; c: string }[]>`
    select token_address, count(*)::bigint as c
      from token_transfers
     where token_address in ${sql(addrs)}
     group by token_address
  `;
  const counts = new Map(rows.map((r) => [r.token_address, Number(r.c)]));
  const out = cards.map((c) => ({ ...c, windowedTransfers: counts.get(c.address) ?? 0 }));
  if (resort) {
    const rank = (c: TokenCard) => c.transferCount ?? c.windowedTransfers ?? 0;
    out.sort((a, b) => rank(b) - rank(a) || (b.holderCount ?? 0) - (a.holderCount ?? 0));
  }
  return out;
}

// every token whose name OR symbol matches `term` (case-insensitive, exact),
// ranked by activity. this is the disambiguation surface.
export async function tokenCollisions(term: string, limit = 50): Promise<TokenCard[]> {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const rows = await sql<CardRow[]>`
    select ${cardColumns()}
      from tokens t
      left join token_stats ts on ts.token_address = t.address
      left join contracts c on c.address = t.address
      left join blocks b on b.number = c.creation_block
      left join cold_blocks cb on cb.number = c.creation_block
     where lower(t.name) = ${t} or lower(t.symbol) = ${t}
     order by ts.transfer_count desc nulls last,
              ts.holder_count desc nulls last,
              c.creation_block asc nulls last
     limit ${limit}
  `;
  return attachWindowed(rows.map(toCard));
}

// other tokens that share this token's name or symbol (excluding itself). drives
// the "N other tokens use this name" note on a token page.
export async function collidingTokens(
  address: string,
  name: string | null,
  symbol: string | null,
  limit = 25,
): Promise<TokenCard[]> {
  const a = address.toLowerCase();
  const n = name?.trim().toLowerCase() ?? null;
  const s = symbol?.trim().toLowerCase() ?? null;
  if (!n && !s) return [];
  const rows = await sql<CardRow[]>`
    select ${cardColumns()}
      from tokens t
      left join token_stats ts on ts.token_address = t.address
      left join contracts c on c.address = t.address
      left join blocks b on b.number = c.creation_block
      left join cold_blocks cb on cb.number = c.creation_block
     where t.address <> ${a}
       and (
         ${n != null ? sql`lower(t.name) = ${n}` : sql`false`}
         or ${s != null ? sql`lower(t.symbol) = ${s}` : sql`false`}
       )
     order by ts.transfer_count desc nulls last, ts.holder_count desc nulls last
     limit ${limit}
  `;
  return attachWindowed(rows.map(toCard));
}

// is this address a token? routes a 40-hex search to the token page vs the bare
// address page. "known token" is any of: we hold metadata for it, we have a
// hydration/stats row for it, or we have seen a standard Transfer emitted by it.
// token_transfers.token_address is always the emitting contract (an eoa never
// emits logs), so a hit there is a reliable token signal even before the metadata
// worker has resolved a name. all four probes are cheap: pk lookups plus one
// index seek on token_transfers(token_address).
export async function isKnownToken(address: string): Promise<boolean> {
  const a = address.toLowerCase();
  const [row] = await sql<{ ok: boolean }[]>`
    select (
      exists(select 1 from tokens where address = ${a})
      or exists(select 1 from token_hydration where token_address = ${a})
      or exists(select 1 from token_stats where token_address = ${a})
      or exists(select 1 from token_transfers where token_address = ${a})
    ) as ok
  `;
  return row?.ok ?? false;
}

export interface TokenTransfer {
  blockNumber: number;
  logIndex: number;
  txHash: string;
  blockTimestamp: string;
  from: string;
  to: string;
  value: string | null;
  tokenId: string | null;
  tokenType: string;
}

// a token's recent transfers, newest first. index range read on
// (token_address, block_number desc).
export async function tokenTransfers(address: string, limit = 50): Promise<TokenTransfer[]> {
  const a = address.toLowerCase();
  const rows = await sql<
    {
      block_number: string;
      log_index: number;
      tx_hash: string;
      block_timestamp: Date;
      from_address: string;
      to_address: string;
      value: string | null;
      token_id: string | null;
      token_type: string;
    }[]
  >`
    select block_number, log_index, tx_hash, block_timestamp,
           from_address, to_address, value, token_id, token_type
      from token_transfers
     where token_address = ${a}
     order by block_number desc, log_index desc
     limit ${limit}
  `;
  return rows.map((r) => ({
    blockNumber: Number(r.block_number),
    logIndex: Number(r.log_index),
    txHash: r.tx_hash,
    blockTimestamp: new Date(r.block_timestamp).toISOString(),
    from: r.from_address,
    to: r.to_address,
    value: r.value == null ? null : String(r.value),
    tokenId: r.token_id == null ? null : String(r.token_id),
    tokenType: r.token_type,
  }));
}

// tokens landing: most active tokens by transfer count, metadata joined.
export async function topTokens(limit = 50): Promise<TokenCard[]> {
  const rows = await sql<CardRow[]>`
    select ${cardColumns()}
      from token_stats ts
      join tokens t on t.address = ts.token_address
      left join contracts c on c.address = t.address
      left join blocks b on b.number = c.creation_block
      left join cold_blocks cb on cb.number = c.creation_block
     order by ts.transfer_count desc nulls last, ts.holder_count desc nulls last
     limit ${limit}
  `;
  return attachWindowed(rows.map(toCard));
}

// new-token feed: contract deployments newest first, metadata and stats joined. a
// deployment is a tx with no `to` whose receipt carried a contract_address. the
// driving table is contracts, so the address comes from c.address (a non-token
// contract has no tokens row).
export async function newTokenFeed(limit = 50): Promise<TokenCard[]> {
  const rows = await sql<CardRow[]>`
    select c.address as address, t.name, t.symbol, t.decimals, t.token_type, t.total_supply,
           ts.holder_count, ts.transfer_count, ts.first_transfer_block, ts.top10_share,
           coalesce(ts.deployer_address, c.creator) as deployer,
           c.creation_block, c.creation_tx,
           coalesce(b.timestamp, cb.timestamp) as creation_time
      from contracts c
      left join tokens t on t.address = c.address
      left join token_stats ts on ts.token_address = c.address
      left join blocks b on b.number = c.creation_block
      left join cold_blocks cb on cb.number = c.creation_block
     where c.creation_block is not null
     order by c.creation_block desc
     limit ${limit}
  `;
  return attachWindowed(rows.map(toCard), false);
}

export interface TokenMeta {
  symbol: string | null;
  name: string | null;
  decimals: number | null;
  tokenType: string | null;
}

// metadata for a set of token addresses, for rendering transfer amounts. a single
// pk-keyed read over the unpartitioned tokens table.
export async function tokenMetas(addresses: string[]): Promise<Record<string, TokenMeta>> {
  const uniq = [...new Set(addresses.map((a) => a.toLowerCase()))];
  if (uniq.length === 0) return {};
  const rows = await sql<
    { address: string; name: string | null; symbol: string | null; decimals: number | null; token_type: string | null }[]
  >`
    select address, name, symbol, decimals, token_type
      from tokens where address in ${sql(uniq)}
  `;
  const out: Record<string, TokenMeta> = {};
  for (const r of rows) {
    out[r.address] = {
      symbol: r.symbol,
      name: r.name,
      decimals: r.decimals == null ? null : Number(r.decimals),
      tokenType: r.token_type,
    };
  }
  return out;
}

export interface Holding {
  tokenAddress: string;
  balance: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  tokenType: string | null;
}

// an address's token holdings. index range read on token_balances(holder_address).
export async function addressHoldings(address: string, limit = 100): Promise<Holding[]> {
  const a = address.toLowerCase();
  const rows = await sql<
    {
      token_address: string;
      balance: string;
      name: string | null;
      symbol: string | null;
      decimals: number | null;
      token_type: string | null;
    }[]
  >`
    select tb.token_address, tb.balance, t.name, t.symbol, t.decimals, t.token_type
      from token_balances tb
      left join tokens t on t.address = tb.token_address
     where tb.holder_address = ${a} and tb.balance > 0
     order by tb.balance desc
     limit ${limit}
  `;
  return rows.map((r) => ({
    tokenAddress: r.token_address,
    balance: String(r.balance),
    name: r.name,
    symbol: r.symbol,
    decimals: r.decimals == null ? null : Number(r.decimals),
    tokenType: r.token_type,
  }));
}
