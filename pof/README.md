# proof of flywheel

**every trade turns the wheel** — a public flywheel layer for launch tokens.

Terminal-style single-page site for Proof of Flywheel (POF): compact bracketed
navigation, live tickers, a featured genesis flywheel card, protocol stats,
how-it-works, an allocation engine with five switchable modes, the live
flywheel slot board, and pale-green recent-cycle rows.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Production: `npm run build && npm start`. Deploys to Vercel with zero config
(Next.js auto-detected).

## Stack

Next.js 15 (app router) · TypeScript · Tailwind CSS 3 · Lucide icons.
JetBrains Mono everywhere. No wallet SDKs, no RPC clients, no auth providers —
the interface runs entirely on local state (`lib/store.tsx` drives the cycle
countdown, wheel speed, activity stream, sign-in/wallet flows and the launch →
review → deploy sequence; sessions persist to `localStorage`).

Reserve balances are never fabricated — they render as `—` with "publishes
on-chain at launch" until an engine reports real balances.

## Structure

```
app/            layout, page, globals, icon
components/     top-nav, tickers, hero, featured-flywheel, stats-row,
                how-it-works, allocation-bar, flywheels-grid, recent-cycles,
                site-footer, toaster, ui primitives,
                modals/ (launch, sign-in, wallet, deploy)
data/mock-data.ts   engine constants + seed data in one place
lib/store.tsx       app state + 1s cycle clock + auth gating
types/index.ts      shared types
```

Allocation segment colors were validated for colorblind-safe separation and
≥3:1 contrast against the panel surface.
