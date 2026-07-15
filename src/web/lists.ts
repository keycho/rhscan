// latest-blocks and latest-transactions reads for the home page and its head
// pollers, plus the address transaction list enrichment.
//
// every read here is a reverse index scan bounded by a small limit: blocks by
// `number desc` (pk / partition), transactions by the
// (block_number desc, tx_index desc) index. none of them scan a partition.

import { sql } from "../db.js";

// how many blocks back the "latest" reads scan. this bound exists purely to force
// partition pruning: `order by ... limit` over a partitioned table should merge
// the per-partition indexes (MergeAppend), but with drifting stats the planner
// can flip to Append + Sort — a full sort of the whole ~150M-row transactions
// table for a LIMIT 12, which trips the statement timeout. bounding by
// block_number prunes to the most-recent partition(s) so the ordered index scan
// is the only plan. the LIMIT still caps rows read; 20k blocks always holds far
// more than any limit.
const RECENT_BLOCKS = 20_000;

const toHex = (b: unknown): string | null => {
  if (b == null) return null;
  const buf = b as Buffer;
  if (buf.length === 0) return null;
  return "0x" + Buffer.from(buf).toString("hex");
};

export interface BlockSummary {
  number: number;
  hash: string;
  timestamp: string;
  miner: string;
  gasUsed: number;
  txCount: number;
}

export interface TxSummary {
  hash: string;
  blockNumber: number;
  blockTimestamp: string;
  txIndex: number;
  from: string;
  to: string | null;
  value: string;
  methodId: string | null;
  status: number | null;
}

export async function latestBlocks(limit = 12): Promise<BlockSummary[]> {
  const rows = await sql<
    { number: string; hash: string; timestamp: Date; miner: string; gas_used: string; tx_count: number }[]
  >`
    select number, hash, timestamp, miner, gas_used, tx_count
      from blocks
     where number > (select max(number) from blocks) - ${RECENT_BLOCKS}
     order by number desc
     limit ${limit}
  `;
  return rows.map((r) => ({
    number: Number(r.number),
    hash: r.hash,
    timestamp: new Date(r.timestamp).toISOString(),
    miner: r.miner,
    gasUsed: Number(r.gas_used),
    txCount: Number(r.tx_count),
  }));
}

export async function latestTransactions(limit = 12): Promise<TxSummary[]> {
  const rows = await sql<
    {
      hash: string;
      block_number: string;
      block_timestamp: Date;
      tx_index: number;
      from_address: string;
      to_address: string | null;
      value: string;
      method_id: Buffer | null;
      status: number | null;
    }[]
  >`
    select hash, block_number, block_timestamp, tx_index,
           from_address, to_address, value, method_id, status
      from transactions
     where block_number > (select max(number) from blocks) - ${RECENT_BLOCKS}
     order by block_number desc, tx_index desc
     limit ${limit}
  `;
  return rows.map((r) => ({
    hash: r.hash,
    blockNumber: Number(r.block_number),
    blockTimestamp: new Date(r.block_timestamp).toISOString(),
    txIndex: Number(r.tx_index),
    from: r.from_address,
    to: r.to_address,
    value: String(r.value),
    methodId: toHex(r.method_id),
    status: r.status == null ? null : Number(r.status),
  }));
}

// enrich a set of (blockNumber, txIndex) references from the address list into
// full display rows. reads by block_number (partition-pruned) across the window
// and cold tables, then matches on tx_index in memory. the reference set is
// bounded by the address list limit, so this touches at most a handful of blocks.
export interface AddressTxRow extends TxSummary {
  direction: string;
}

export async function enrichAddressTxns(
  refs: { blockNumber: number; txIndex: number; txHash: string; direction: string }[],
): Promise<AddressTxRow[]> {
  if (refs.length === 0) return [];
  const blockNums = [...new Set(refs.map((r) => r.blockNumber))];

  const rows = await sql<
    {
      hash: string;
      block_number: string;
      block_timestamp: Date;
      tx_index: number;
      from_address: string;
      to_address: string | null;
      value: string;
      method_id: Buffer | null;
      status: number | null;
    }[]
  >`
    select hash, block_number, block_timestamp, tx_index,
           from_address, to_address, value, method_id, status
      from transactions
     where block_number in ${sql(blockNums)}
    union all
    select hash, block_number, block_timestamp, tx_index,
           from_address, to_address, value, method_id, status
      from cold_transactions
     where block_number in ${sql(blockNums)}
  `;

  const byKey = new Map<string, (typeof rows)[number]>();
  for (const r of rows) byKey.set(`${r.block_number}:${r.tx_index}`, r);

  return refs.map((ref) => {
    const r = byKey.get(`${ref.blockNumber}:${ref.txIndex}`);
    if (!r) {
      // reference exists but the tx row is not in window or cold (edge case:
      // pruned between reads). fall back to the hash and block only.
      return {
        hash: ref.txHash,
        blockNumber: ref.blockNumber,
        blockTimestamp: "",
        txIndex: ref.txIndex,
        from: "",
        to: null,
        value: "0",
        methodId: null,
        status: null,
        direction: ref.direction,
      };
    }
    return {
      hash: r.hash,
      blockNumber: Number(r.block_number),
      blockTimestamp: new Date(r.block_timestamp).toISOString(),
      txIndex: Number(r.tx_index),
      from: r.from_address,
      to: r.to_address,
      value: String(r.value),
      methodId: toHex(r.method_id),
      status: r.status == null ? null : Number(r.status),
      direction: ref.direction,
    };
  });
}
