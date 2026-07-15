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
  day: string; // yyyy-mm-dd, or yyyy-mm-ddThh:00 when bucketed by hour (utc)
  txCount: number;
  blocks: number;
}

export interface TxChartData {
  // "hour" when the indexed span is short (a day or two of this fast chain), so
  // the chart shows ~24 intraday bars instead of one lonely daily bar; "day"
  // once the span is wide enough for daily buckets to be meaningful.
  granularity: "hour" | "day";
  buckets: DayBucket[];
}

// how many recent blocks the chart aggregates. one partition's worth by default,
// so the query stays bounded and fast even before the covering index / vacuum are
// in place. raise it (env) once blocks_home_stats_idx exists and blocks has been
// vacuumed, to widen the chart back across the full window.
const CHART_BLOCKS = Number(process.env.CHART_BLOCKS ?? 500_000);

// bucket by hour when the indexed span is at or below this many days.
const HOURLY_SPAN_DAYS = 2;

export async function txPerDay(): Promise<TxChartData> {
  // the indexed span of the bounded range decides the bucket size. this reads
  // min/max over the same block_number-bounded slice (index range read, prunes to
  // the recent partition), NOT a timestamp scan — the whole point of the number
  // bound. a fast chain packs the 500k-block slice into ~a day, so daily buckets
  // collapse to one bar; hourly buckets give a real intraday shape.
  const [span] = await sql<{ lo: Date | null; hi: Date | null }[]>`
    select min(timestamp) as lo, max(timestamp) as hi
      from blocks
     where number > (select max(number) from blocks) - ${CHART_BLOCKS}
  `;
  const lo = span?.lo ? new Date(span.lo).getTime() : null;
  const hi = span?.hi ? new Date(span.hi).getTime() : null;
  const spanDays = lo != null && hi != null ? (hi - lo) / 86_400_000 : 0;
  const granularity: "hour" | "day" = spanDays <= HOURLY_SPAN_DAYS ? "hour" : "day";

  const rows = await sql<{ bucket: Date; txs: string | null; blks: string }[]>`
    select date_trunc(${granularity}, timestamp) as bucket,
           sum(tx_count) as txs,
           count(*) as blks
      from blocks
     where number > (select max(number) from blocks) - ${CHART_BLOCKS}
     group by 1
     order by 1
  `;
  const buckets = rows.map((r) => ({
    // day → yyyy-mm-dd, hour → yyyy-mm-ddThh:00 (utc), both sortable as labels.
    day: new Date(r.bucket).toISOString().slice(0, granularity === "hour" ? 13 : 10),
    txCount: Number(r.txs ?? 0),
    blocks: Number(r.blks),
  }));
  return { granularity, buckets };
}
