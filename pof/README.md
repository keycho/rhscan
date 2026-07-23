# proof of flywheel

**creator-funded SOL turns the wheel** — a configurable routing layer for
Pump.fun token creators. deposit. route. verify.

Terminal-style site for Proof of Flywheel (POF), currently a **public
technical preview** with a complete interactive creation demo: connect a real
Solana wallet, pick a token, configure routing, plan a deposit and create a
flywheel preview that persists per wallet. No transaction is ever built,
signed or submitted, and no SOL moves.

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
- **Demo:** the five-step creation wizard (select token / configure routing /
  fund / review / create) produces a configuration preview saved to
  localStorage under the connected public key, shown at `/preview`. The
  genesis engine on the dashboard is demonstration data driven by a local
  clock. The "recent cycles" section is a truthful empty state — no rows
  render until genuine onchain cycles exist.

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
