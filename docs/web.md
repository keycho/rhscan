# rhscan web explorer

a next.js app router frontend for robinhood chain. dark, dense, monospace for hex
and numbers. server-rendered throughout: server components read postgres directly
through the existing `postgres.js` client (`src/db.ts`) and call the same
cold-path resolver (`src/resolve.ts`) the brief specifies. there is no
client-side fetching for initial render; the only client fetch is the home page's
head poller.

## running it

```
# same database the indexer writes to
export DATABASE_URL=postgres://...
export RPC_URL=https://your-paid-provider/robinhood-chain

pnpm install
pnpm web:dev        # next dev
pnpm web:start      # next start (after `pnpm build`)
```

the app lives at the repo root alongside the indexer. `next.config.mjs` teaches
webpack to resolve the indexer's `.js` import specifiers to their `.ts` sources,
so the web layer reuses `resolve.ts`, `holders.ts`, `chain.ts`, `window.ts` and
`db.ts` directly rather than duplicating them. the indexer keeps its own
typecheck (`pnpm typecheck:indexer`, `tsconfig.indexer.json`); the web app uses
the root `tsconfig.json`.

## pages

| route | what it shows |
| --- | --- |
| `/` | stats bar (latest block, indexed tx estimate, tps, median gas, eth price), latest blocks and transactions side by side (polling the head), a 14-day tx chart, prominent search |
| `/block/[id]` | header fields, gas, fee recipient, l1 block number, tx list, prev/next. accepts a number or a hash |
| `/tx/[hash]` | status, block, timestamp, from/to, value, the **l2 fee breakdown**, decoded method, token transfers, raw input with a decode toggle, event logs |
| `/address/[addr]` | live balance/nonce, tx list from `address_transactions` (a single index range read), token holdings from `token_balances`; contract creator/creation and a contract tab when it is a contract |
| `/token/[addr]` | name/symbol/supply/holders/decimals/deployer, transfers and holders tabs, name-collision note, deployer's other launches |
| `/tokens` | most active and newly deployed tokens, and the collision search |
| `/search` | dispatch: hash/address/number resolve to a page; a name/symbol shows every colliding token |

## the l2 fee breakdown

most explorers get arbitrum fees wrong. the maths (in `src/web/arb.ts`): on nitro
the receipt's `gasUsed` already includes an l1 data component, `gasUsedForL1`,
charged at the same `effectiveGasPrice` as execution gas. so

```
totalFee  = gasUsed                * effectiveGasPrice
l1DataFee = gasUsedForL1           * effectiveGasPrice
l2ExecFee = (gasUsed - gasUsedForL1) * effectiveGasPrice
```

and `totalFee = l1DataFee + l2ExecFee` exactly. we split the single `gasUsed`
figure; we never add a separately-fetched l1 fee on top of it. when a receipt
carries no `gasUsedForL1`, we show the total and say the split is unavailable
rather than invent one.

## the feature: name-collision disambiguation

impersonation is the normal condition on this chain (the day-3 sample found three
separate `Chewy` contracts, three `Tylee`, two "Robinhood's Dog", and a memecoin
`Chewy` colliding with the tokenized stock `CHWY`). when a search matches more
than one token by name or symbol, the explorer shows all of them, ranked by
activity, each with deployment date, deployer, holder count, transfer count and
top-10 concentration (`src/web/tokens-web.ts`, `components/CollisionTable.tsx`).
on a token page, other tokens sharing its name or symbol are listed and linked.

facts only. no scores, no risk ratings, no "this looks like a rug". the numbers
are shown and the reader decides. that restraint is the point.

migration `0003_token_search.sql` adds functional indexes on `lower(name)` and
`lower(symbol)` so the collision lookup is an index read, not a scan over the
unbounded `tokens` table.

## the two honesty requirements

**1. windowed history.** the index holds a rolling recent window (`WINDOW_BLOCKS`,
a few days of this chain). older data resolves live through `src/resolve.ts` and
caches back; a page never renders empty for old data, it routes the miss through
the resolver. every resolver result carries a `source` field, and where a page
came from the live fallback we say so subtly (`components/badges.tsx`
`SourceBadge`, `components/Disclosures.tsx` `LiveFallbackNote`). address pages
truncate below the window floor and disclose the indexed range plainly rather than
show a partial list as complete (`AddressTruncationNote`). the footer states the
indexed range on every page (`IndexedRangeNote`).

**2. balances that may be wrong.** a token on this chain has a live `balanceOf`
that diverges from its own `Transfer` history (fee-on-transfer, rebasing,
blacklist tokens all do this). on the holders tab, `src/web/drift.ts` compares the
replayed top balances against live `balanceOf` **at the hydrated block** (so an
actively-traded token's real movement is not mistaken for drift) via multicall3.
on disagreement the token is flagged and the divergent rows marked
(`components/Disclosures.tsx` `DriftBanner`, `components/HoldersTable.tsx`); when
the chain state is unreadable it says "could not verify" rather than assert
either way. a holders list that is quietly wrong is worse than one that admits it
cannot be verified.

## caching

anything a safe distance below the head is immutable (a reorg only touches the
last handful of blocks), so it is cached hard. head-adjacent data gets short
revalidation.

- route-segment `revalidate` (5s on head-adjacent pages) becomes the cdn
  `s-maxage` / `stale-while-revalidate` window on vercel.
- confirmed point lookups (a block below the reorg depth, the holder drift check
  at a fixed block) are wrapped in `unstable_cache` with a one-year ttl
  (`src/web/cache.ts`), so immutable data is never recomputed.
- the home head lists poll `/api/head`, which is `no-store`; it is the only
  always-fresh read.
- the eth price is cached 60s server-side (coingecko).

## query plans

the two reads the brief requires to be index range reads are proven with real
`explain (analyze, buffers)` in [`query-plans.md`](query-plans.md). the address
tx list is a single index scan on `(address, block_number desc, tx_index desc)`
with no sort; the token holders read is an index scan on
`(token_address, balance desc)` that also delivers the ordering. reproduce with
`pnpm explain` (needs `DATABASE_URL`).

## out of scope

- internal transactions / traces (not available on this chain's rpc).
- contract source verification (the contract tab is intentionally empty with a
  note; a blockscout `getsourcecode` proxy could fill it later).
- dex prices and liquidity.

## copy conventions

lowercase user-facing copy, no em-dashes, no exclamation marks.
