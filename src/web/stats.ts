// home-page network statistics, all derived from indexed data.
//
// two of these deliberately avoid a full-table count over the partitioned
// transactions table (tens of millions of rows in the window):
//   - the indexed transaction total uses the planner's per-partition row
//     estimate (pg_class.reltuples), the standard way to show a "total txns"
//     figure without scanning. it is an estimate and is labelled as one in the
//     ui.
//   - tps and median gas are computed over a bounded slice of the small `blocks`
//     table (an index range read on `number`), never over transactions.

import { sql } from "../db.js";

// how many recent blocks to measure tps and gas over. ~0.10s block time means a
// few thousand blocks still only spans minutes, but 1s timestamp resolution needs
// a wide enough span to be meaningful.
const TPS_WINDOW = 5000;
const GAS_WINDOW = 2000;

export interface NetworkStats {
  head: number | null;
  latestBlockTime: string | null;
  txCountEstimate: number;
  tps: number | null;
  medianBaseFeeWei: string | null;
}

// summed per-partition row estimate for the partitioned transactions table.
// accurate after autovacuum/analyze, and effectively free (reads catalog only).
export async function estimatedTxCount(): Promise<number> {
  const [row] = await sql<{ est: string }[]>`
    select coalesce(sum(c.reltuples), 0)::bigint as est
      from pg_inherits i
      join pg_class c on c.oid = i.inhrelid
      join pg_class p on p.oid = i.inhparent
     where p.relname = 'transactions'
  `;
  const est = row ? Number(row.est) : 0;
  return est > 0 ? est : 0;
}

export async function getNetworkStats(): Promise<NetworkStats> {
  // head via the min/max index optimisation + a pk equality lookup, NOT
  // `order by number desc limit 1`: the latter can flip to an Append + Sort of
  // the whole partitioned blocks table under drifting stats. max() is rewritten
  // to a per-partition index scan and never seq-scans.
  const [latest] = await sql<{ number: string; timestamp: Date }[]>`
    select number, timestamp from blocks
     where number = (select max(number) from blocks)
  `;
  const head = latest ? Number(latest.number) : null;

  const txCountEstimate = await estimatedTxCount();

  let tps: number | null = null;
  let medianBaseFeeWei: string | null = null;

  if (head != null) {
    // tps over the recent slice: sum of tx_count divided by the timestamp span.
    const [t] = await sql<{ txs: string | null; secs: number | null }[]>`
      select sum(tx_count) as txs,
             extract(epoch from (max(timestamp) - min(timestamp))) as secs
        from blocks
       where number > ${head - TPS_WINDOW}
    `;
    if (t && t.txs != null && t.secs != null && Number(t.secs) > 0) {
      tps = Number(t.txs) / Number(t.secs);
    }

    // median base fee over recent blocks, shown as the network gas price. reads
    // ~GAS_WINDOW small block rows via the number index.
    const [g] = await sql<{ median: string | null }[]>`
      select percentile_cont(0.5) within group (order by base_fee_per_gas)::numeric(78,0) as median
        from blocks
       where number > ${head - GAS_WINDOW} and base_fee_per_gas is not null
    `;
    medianBaseFeeWei = g?.median != null ? String(g.median) : null;
  }

  return {
    head,
    latestBlockTime: latest ? new Date(latest.timestamp).toISOString() : null,
    txCountEstimate,
    tps,
    medianBaseFeeWei,
  };
}

// transactions per day for the home chart. bounded by block_number, NOT by a
// `timestamp >= now() - 14d` predicate: the window spans only a few days, so that
// predicate matched nearly every row and forced a full seq scan of the ~1M-row
// blocks table (partitions are by number, so a timestamp filter cannot prune).
// bounding by number prunes to the most-recent partition(s) and, with the
// covering index blocks_home_stats_idx (migration 0004), runs index-only. the ui
// frames whatever days come back against a 14-day axis and discloses the window.
export interface DayBucket {
  day: string; // yyyy-mm-dd (utc)
  txCount: number;
  blocks: number;
}

// how many recent blocks the chart aggregates. one partition's worth by default,
// so the query stays bounded and fast even before the covering index / vacuum are
// in place. raise it (env) once blocks_home_stats_idx exists and blocks has been
// vacuumed, to widen the chart back across the full window.
const CHART_BLOCKS = Number(process.env.CHART_BLOCKS ?? 500_000);

export async function txPerDay(): Promise<DayBucket[]> {
  const rows = await sql<{ day: Date; txs: string | null; blks: string }[]>`
    select date_trunc('day', timestamp) as day,
           sum(tx_count) as txs,
           count(*) as blks
      from blocks
     where number > (select max(number) from blocks) - ${CHART_BLOCKS}
     group by 1
     order by 1
  `;
  return rows.map((r) => ({
    day: new Date(r.day).toISOString().slice(0, 10),
    txCount: Number(r.txs ?? 0),
    blocks: Number(r.blks),
  }));
}
