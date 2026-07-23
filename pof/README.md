# Proof of Flywheel (POF)

**every trade turns the wheel** — a public flywheel layer for launch tokens.

A frontend-only showcase of a Pump.fun-style flywheel engine platform: a dark,
terminal-style dashboard that tracks fees, cycles, reserves, allocations and
momentum for a single genesis token ($POF), plus an onboarding/launch flow that
makes it obvious other tokens can plug in.

> **Simulation mode.** There is no backend, no wallet SDK, no RPC, no auth
> provider and no on-chain execution. Every number is mocked locally and every
> action (sign-in, wallet connect, engine deployment) is simulated with React
> state, `localStorage` and timed delays.
>
> **Except reserve balances.** A reserve balance is a claim about real held
> funds, so it is never fabricated — reserve fields render as `—` with
> "publishes on-chain at launch" until an engine reports real balances.

## Run it

```bash
cd pof
npm install
npm run dev      # http://localhost:3000
```

Production build: `npm run build && npm start`.

## What's inside

- **Live-feeling dashboard** — a 1s simulation clock drives the epoch countdown,
  flywheel speed jitter, an activity feed that receives new entries every few
  seconds, and epoch rollovers that prepend new rows to the cycle table and
  update the fees chart.
- **Flywheel graphic** — animated SVG loop (fees in → reserve → liquidity →
  burn → community → momentum) with travelling flow dots and a cycling active
  node.
- **Allocation engine** — five engine modes (momentum / stability / growth /
  defensive / community); switching modes animates the donut, the segmented bar
  and the per-reserve rows.
- **Simulated auth** — sign-in modal (X / Discord / Email / Solana wallet) and a
  Solana-style wallet picker (Phantom, Solflare, Backpack, Coinbase Wallet,
  WalletConnect). Three access levels: public visitor → signed-in user →
  connected wallet. Gated actions chain the right modals and then continue.
- **Launch flow** — configure token address, mode, trigger and slug; with a
  connected wallet the CTA becomes **Preview Engine Deployment** →
  **Simulate Deployment** → "Engine deployed in demo mode", and the draft lands
  in **My Engines** (persisted to `localStorage`).

## Stack

Next.js 15 (app router) · TypeScript · Tailwind CSS 3 · Recharts · Lucide icons.
No wallet-adapter, no auth SDKs, no RPC clients — by design.

## Structure

```
app/            layout, page, globals, icon
components/     top-nav, hero, flywheel-graphic, allocation-panel, cycle-table,
                activity-feed, launch-panel, my-engines, open-slots, docs-panel,
                modals/ (sign-in, wallet, deploy), toaster, ui primitives
data/mock-data.ts   every mocked value in one place
lib/store.tsx       app state + 1s simulation reducer + auth gating
types/index.ts      shared types
```

Chart/donut series colors were validated for colorblind-safe separation and
≥3:1 contrast against the panel surface (see comments in `data/mock-data.ts`).
