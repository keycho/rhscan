-- token name/symbol search indexes for the explorer's name-collision feature.
--
-- impersonation is the normal condition on this chain: the day-3 sample turned up
-- three separate contracts named Chewy, three named Tylee, two literally called
-- "Robinhood's Dog", and a memecoin Chewy colliding with the tokenized Chewy
-- stock (CHWY). the web app surfaces every contract that shares a searched name
-- or symbol so a reader can tell them apart. that lookup must be an index read,
-- not a sequential scan over the whole tokens table, which grows without bound
-- (every token ever seen in a windowed transfer gets a row).
--
-- these are functional btree indexes on the lowercased text, matching the
-- case-insensitive equality the collision query uses (where lower(name) = $1).
-- text_pattern_ops additionally lets a prefix search (lower(name) like $1 || '%')
-- use the same index. tokens is unpartitioned metadata, so a single plain index
-- on the parent is all that is needed.

create index if not exists tokens_lower_name_idx
  on tokens (lower(name) text_pattern_ops);

create index if not exists tokens_lower_symbol_idx
  on tokens (lower(symbol) text_pattern_ops);
