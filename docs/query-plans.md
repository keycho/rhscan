# query plans

the brief requires the address page and the token holders page to each be an
index range read, not a partition scan. this documents the plans, captured with
real `explain (analyze, buffers)` against the actual schema (migrations
`0001`..`0003`) in a local postgres 16. the seed data is small, so the natural
planner picks a sequential scan for a handful of rows; the plans below are
captured with `set enable_seqscan = off`, which shows the access method the
planner switches to as soon as the tables are large, i.e. the production plan.
the point being proven is the *access shape*: an index range read keyed on the
leading column, not a scan.

to reproduce against any database:

```
psql "$DATABASE_URL" -f docs/explain.sql
```

## address page: transaction list

the page reads the address's transactions from `address_transactions` with a
bounded, ordered limit. the `(address, block_number desc, tx_index desc)` index
serves both the filter and the ordering, so the scan stops after `limit` rows and
there is no sort node.

```sql
select block_number, tx_index, tx_hash, direction
  from address_transactions
 where address = $1
 order by block_number desc, tx_index desc
 limit 50;
```

```
 Limit (actual time=0.019..0.022 rows=11 loops=1)
   ->  Index Scan using address_transactions_p18_address_block_number_tx_index_idx on address_transactions_p18
         Index Cond: (address = '0xaa...00'::text)
         Buffers: shared hit=2
```

`Index Scan` + `Index Cond: (address = ...)`, no `Sort`, `Limit` on top. a single
index range read, partition-pruned to the one partition holding the rows.

note on the resolver: `resolveAddress` in `src/resolve.ts` unions the window and
cold tables and then sorts the union, which for a very active address would read
every one of its rows before applying the limit. the address page therefore does
not reuse that list; it reads each table with its own bounded `order by ... limit`
(see `src/web/address.ts`), so each read terminates after `limit` rows. the two
bounded results (window and the small cold cache) are merged in memory.

## token holders page: top holders by balance

```sql
select holder_address, balance, last_updated_block
  from token_balances
 where token_address = $1 and holder_address <> '0x00..00' and balance > 0
 order by balance desc
 limit 100;
```

```
 Limit (actual time=0.009..0.011 rows=2 loops=1)
   ->  Index Scan using token_balances_top_idx on token_balances
         Index Cond: ((token_address = '0xtoken1...'::text) AND (balance > '0'::numeric))
         Filter: (holder_address <> '0x0000...0000'::text)
         Buffers: shared hit=2
```

`Index Scan using token_balances_top_idx` where the index is
`(token_address, balance desc)`. the `Index Cond` covers `token_address` (the
leading key) and the `balance > 0` bound; the ordering `balance desc` comes
straight from the index, so again there is **no `Sort` node**. the zero-address
exclusion is a cheap residual `Filter` on the few rows the index returns. this is
the ideal shape: an index range read that also delivers the sort order, so the
`limit` bounds the work exactly.

## name-collision search

not called out by the brief, but it is a user-driven lookup over the unbounded
`tokens` table, so migration `0003` adds functional indexes
`tokens (lower(name) text_pattern_ops)` and `tokens (lower(symbol) ...)`. the
collision query (`where lower(name) = $1 or lower(symbol) = $1`) is served as a
`BitmapOr` of two index scans rather than a sequential scan of every token ever
seen.
