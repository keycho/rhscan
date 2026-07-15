-- the metadata worker's discovery query was the #1 db cpu consumer: a full scan
-- every worker tick (~1.5s each). two independent root causes, both fixed here.
--
-- 1. the 0005 partial index `where metadata_fetched_at is null` did NOT match the
--    query's real intent. rows resolved by the pre-0005 worker carry full
--    metadata but a null metadata_fetched_at, so they filled that index while
--    never matching the `(name is null or ...)` filter — the scan waded through
--    all of them every tick and found nothing. replace it with a partial index
--    whose condition is EXACTLY the discovery predicate, so it holds only the rows
--    that genuinely need metadata (and is empty, hence instant, once drained).
create index if not exists tokens_missing_metadata_idx on tokens (address)
  where metadata_fetched_at is null
    and (name is null or symbol is null or decimals is null or total_supply is null);

-- the 0005 index is now redundant: its condition is a strict superset the planner
-- could not use for this query, and it just adds write overhead on tokens.
drop index if exists tokens_needs_metadata_idx;

-- 2. the second discovery branch scanned ALL of token_transfers every tick (a
--    distinct-on anti-join) to find token addresses that had no tokens row yet.
--    that is replaced by seeding a bare tokens row (address + token_type, metadata
--    null) for every token seen in the window: new tokens are now seeded at write
--    time (see writeBlocks), so the worker only reads the small missing-metadata
--    index above and never scans token_transfers. one-time backfill for tokens
--    already present in token_transfers but missing a row:
insert into tokens (address, token_type)
select distinct on (token_address) token_address, token_type
  from token_transfers
 order by token_address
on conflict (address) do nothing;
