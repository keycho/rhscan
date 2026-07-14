-- reproduce the two required query plans against any rhscan database.
-- usage: psql "$DATABASE_URL" -f docs/explain.sql
--
-- pass real values by editing the placeholders below, or run interactively. on a
-- small / freshly loaded database the planner may pick a sequential scan because
-- it is cheaper for few rows; `set enable_seqscan = off` forces the access method
-- the planner uses once the tables are large, which is the shape being proven.

\set addr '0x0000000000000000000000000000000000000000'
\set token '0x0000000000000000000000000000000000000000'
\set zero '0x0000000000000000000000000000000000000000'

set enable_seqscan = off;

-- address page: bounded index range read on (address, block_number desc, tx_index desc)
explain (analyze, buffers, costs off)
select block_number, tx_index, tx_hash, direction
  from address_transactions
 where address = :'addr'
 order by block_number desc, tx_index desc
 limit 50;

-- token holders page: index range read on (token_address, balance desc), ordering from the index
explain (analyze, buffers, costs off)
select holder_address, balance, last_updated_block
  from token_balances
 where token_address = :'token' and holder_address <> :'zero' and balance > 0
 order by balance desc
 limit 100;

reset enable_seqscan;
