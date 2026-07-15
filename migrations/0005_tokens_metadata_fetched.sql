-- metadata backfill for tokens that predate a working metadata worker.
--
-- the worker used to discover work only from token_transfers addresses with no
-- tokens row, treating "a row exists" as "already resolved". but rows created
-- with just address + token_type and null name/symbol/decimals/total_supply
-- (e.g. seeded before the worker resolved them) were never revisited, so a real
-- token like CASHCAT rendered as "unnamed token" forever.
--
-- add a nullable metadata_fetched_at so the worker can tell "never attempted"
-- (null) from "attempted, contract returned nothing" (set, fields still null),
-- and skip the latter instead of re-hammering a contract that has no name().
alter table tokens
  add column if not exists metadata_fetched_at timestamptz;

-- existing rows have never been attempted under the new invariant, so leave
-- metadata_fetched_at null: the worker will pick up every row that is missing
-- metadata and resolve it on the next pass.

-- drives the worker's "needs metadata" scan: rows not yet attempted. partial so
-- the index only holds the unresolved backlog, which drains to empty over time.
create index if not exists tokens_needs_metadata_idx
  on tokens (address)
  where metadata_fetched_at is null;
