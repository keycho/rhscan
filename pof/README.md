# proof of flywheel

**creator-funded SOL turns the wheel** — a configurable routing layer for
Pump.fun token creators. deposit. route. verify.

Terminal-style site for Proof of Flywheel (POF), currently a **public
technical preview**: the genesis flywheel shown on the dashboard is clearly
labelled protocol simulation, wallet connection is real, and contract
execution (deposits, cycles) is disabled until the protocol goes live.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Production: `npm run build && npm start`. Deploys to Vercel with zero config.

Environment:

- `NEXT_PUBLIC_SITE_URL` — canonical production domain (used for absolute
  Open Graph / Twitter image URLs; `VERCEL_URL` is only a fallback).
- `NEXT_PUBLIC_RPC_URL` — optional Solana RPC endpoint (defaults to the
  public mainnet-beta endpoint).
- `NEXT_PUBLIC_SOLANA_NETWORK` — optional, defaults to `mainnet-beta`.

## What's real vs simulated

- **Real:** wallet connection via the official `@solana/wallet-adapter`
  packages (standard wallets only — installed wallets connect, missing ones
  get install links), the connected wallet's on-chain SOL balance, and the
  legal pages (`/terms`, `/privacy`, `/risks`).
- **Simulation (labelled):** the genesis flywheel's cycles, activity feed and
  totals are demonstration data driven by a local clock. Nothing is presented
  as a confirmed onchain transaction, and no transaction is ever created,
  signed or executed by this site.
- **Unavailable (labelled):** creator-token verification and deposits are
  disabled until the protocol contracts go live.

POF never requests seed phrases or private keys.

## Stack

Next.js 15 (app router) · TypeScript · Tailwind CSS 3 · Lucide icons ·
`@solana/wallet-adapter-react` + `@solana/web3.js`. JetBrains Mono everywhere.

## Structure

```
app/            layout, page, globals, icon, og image, terms/privacy/risks
components/     top-nav, tickers, hero, featured-flywheel, cycle-action,
                stats-row, how-it-works, allocation-bar, routing-editor,
                flywheels-grid, recent-cycles, site-footer, legal, toaster,
                ui primitives, solana-provider,
                modals/ (wallet, activation)
data/mock-data.ts   simulation constants in one place
lib/store.tsx       protocol-simulation clock + ui state
lib/use-sol-balance.ts  real on-chain balance hook
types/index.ts      shared types
```

Routing segment colors were validated for colorblind-safe separation and
≥3:1 contrast against the panel surface.
