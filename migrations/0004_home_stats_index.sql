-- home-page performance: keep the block aggregates off the heap.
--
-- the home page runs three aggregates over the partitioned `blocks` table
-- (partitioned by range(number), ~1M rows after a full-window backfill):
--   * tps            sum(tx_count), max/min(timestamp) where number > head-5000
--   * median gas     percentile of base_fee_per_gas   where number > head-2000
--   * tx-per-day     sum(tx_count), count(*)           where number > head-N
--
-- with `number` as the leading key and the aggregated columns INCLUDEd, each of
-- these runs as an INDEX-ONLY scan of a bounded key range (after VACUUM sets the
-- visibility map) instead of a heap seq scan — so they never scan the whole
-- table and stay well under a second even under the serverless max:1 connection.
--
-- created on the partitioned parent, so it propagates to every partition. plain
-- CREATE INDEX (the migration runner wraps each file in a transaction); it takes
-- a brief lock but the window backfill is not writing during a web deploy.
create index if not exists blocks_home_stats_idx
  on blocks (number) include (tx_count, timestamp, base_fee_per_gas);
