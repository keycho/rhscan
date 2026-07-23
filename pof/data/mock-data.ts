import type {
  ActivityEntry,
  AllocationSlice,
  Cycle,
  EngineMode,
  FeesPoint,
} from "@/types";

export const X_URL = "https://x.com/ProofofFlywheel";

// ---------------------------------------------------------------------------
// genesis engine
// ---------------------------------------------------------------------------

// note: reserve balances are deliberately NOT mocked. a reserve balance is a
// claim about real held funds, so the UI renders "—" with "publishes on-chain
// at launch" until an engine reports real balances.
//
// the rest of the genesis numbers are kept at a believable just-launched
// scale (~2 hours of cycles, sub-SOL flows) so the site reads as credible
// on launch day rather than claiming months of invented history.
export const GENESIS = {
  tokenName: "Genesis Wheel",
  ticker: "$POF",
  status: "Live",
  engineId: "001",
  network: "Solana",
  platform: "Pump.fun",
  mint: "4GnW…hE3L",
  graduation: "graduated",
  pool: "canonical PumpSwap pool live",
  eligibility: "eligible",
  mode: "Momentum" as EngineMode,
  epoch: 12,
  nextCycleSeconds: 261, // 04:21
  feesRouted: 6.05,
  totalCycles: 11,
  flywheelSpeed: 92,
  momentumScore: 87,
  totalRoutedValue: "$1.0K",
  tokensRouted: "1.2M",
  burnedSupply: "0.31M",
};

// ---------------------------------------------------------------------------
// allocation engine — donut/segment colors validated for CVD separation and
// >=3:1 contrast against the panel surface (#0d100e); ring order matters, the
// wrap pair (violet -> green) clears the deutan/protan gates.
// ---------------------------------------------------------------------------

export const SERIES = {
  green: "#1fae6d",
  blue: "#3987e5",
  amber: "#c98500",
  magenta: "#d55181",
  violet: "#9085e9",
};

export const ALLOCATION_MODES: Record<EngineMode, AllocationSlice[]> = {
  Momentum: [
    { key: "liq", label: "Liquidity", pct: 35, color: SERIES.green },
    { key: "acq", label: "Growth", pct: 25, color: SERIES.blue },
    { key: "burn", label: "Buyback & Burn", pct: 20, color: SERIES.amber },
    { key: "comm", label: "Holder Rewards", pct: 10, color: SERIES.magenta },
    { key: "trea", label: "Treasury", pct: 10, color: SERIES.violet },
  ],
  Stability: [
    { key: "liq", label: "Liquidity", pct: 45, color: SERIES.green },
    { key: "acq", label: "Growth", pct: 15, color: SERIES.blue },
    { key: "burn", label: "Buyback & Burn", pct: 10, color: SERIES.amber },
    { key: "comm", label: "Holder Rewards", pct: 10, color: SERIES.magenta },
    { key: "trea", label: "Treasury", pct: 20, color: SERIES.violet },
  ],
  Growth: [
    { key: "liq", label: "Liquidity", pct: 30, color: SERIES.green },
    { key: "acq", label: "Growth", pct: 35, color: SERIES.blue },
    { key: "burn", label: "Buyback & Burn", pct: 15, color: SERIES.amber },
    { key: "comm", label: "Holder Rewards", pct: 10, color: SERIES.magenta },
    { key: "trea", label: "Treasury", pct: 10, color: SERIES.violet },
  ],
  Defensive: [
    { key: "liq", label: "Liquidity", pct: 50, color: SERIES.green },
    { key: "acq", label: "Growth", pct: 10, color: SERIES.blue },
    { key: "burn", label: "Buyback & Burn", pct: 5, color: SERIES.amber },
    { key: "comm", label: "Holder Rewards", pct: 10, color: SERIES.magenta },
    { key: "trea", label: "Treasury", pct: 25, color: SERIES.violet },
  ],
  Community: [
    { key: "liq", label: "Liquidity", pct: 30, color: SERIES.green },
    { key: "acq", label: "Growth", pct: 15, color: SERIES.blue },
    { key: "burn", label: "Buyback & Burn", pct: 15, color: SERIES.amber },
    { key: "comm", label: "Holder Rewards", pct: 30, color: SERIES.magenta },
    { key: "trea", label: "Treasury", pct: 10, color: SERIES.violet },
  ],
};

export const MODE_NOTES: Record<EngineMode, string> = {
  Momentum: "aggressive routing into liquidity + growth. built for velocity.",
  Stability: "liquidity-heavy split with a deeper treasury floor.",
  Growth: "growth-weighted. deposits compound into buy-side pressure.",
  Defensive: "max liquidity + treasury. slows the wheel, hardens the floor.",
  Community: "routes a triple tranche into the holder-reward vault.",
};

// what each destination actually does with deposited SOL — no overclaiming
export const ROUTING_DESCRIPTIONS: Record<string, string> = {
  liq: "may swap part of the SOL into the token and pair both assets in the supported PumpSwap pool. requires a graduated token with a canonical pool. liquidity is only reported added once the transaction confirms.",
  burn: "SOL is swapped for the token and the acquired tokens are sent to a recognised burn address. the SOL itself is not burned.",
  comm: "routed into a holder-reward vault. rewards are reserved for holder distribution.",
  trea: "transferred to the treasury address configured by the verified creator. destination shown before confirmation.",
  acq: "transferred to the growth address configured by the verified creator. destination shown before confirmation.",
};

// ---------------------------------------------------------------------------
// cycle timeline — atTick is seconds relative to page load (negative = past)
// ---------------------------------------------------------------------------

export const CYCLE_SEED: Cycle[] = [
  { epoch: 12, feesIn: 0.42, liquidity: 0.15, burn: 0.08, community: 0.04, status: "Processing", atTick: -120 },
  { epoch: 11, feesIn: 0.71, liquidity: 0.25, burn: 0.14, community: 0.07, status: "Complete", atTick: -690 },
  { epoch: 10, feesIn: 0.55, liquidity: 0.19, burn: 0.11, community: 0.06, status: "Complete", atTick: -1260 },
  { epoch: 9, feesIn: 0.64, liquidity: 0.22, burn: 0.13, community: 0.07, status: "Complete", atTick: -1830 },
  { epoch: 8, feesIn: 0.48, liquidity: 0.17, burn: 0.1, community: 0.05, status: "Complete", atTick: -2410 },
  { epoch: 7, feesIn: 0.83, liquidity: 0.29, burn: 0.17, community: 0.09, status: "Complete", atTick: -2980 },
  { epoch: 6, feesIn: 0.37, liquidity: 0.13, burn: 0.07, community: 0.04, status: "Complete", atTick: -3560 },
  { epoch: 5, feesIn: 0.59, liquidity: 0.21, burn: 0.12, community: 0.06, status: "Complete", atTick: -4140 },
  { epoch: 4, feesIn: 0.45, liquidity: 0.16, burn: 0.09, community: 0.05, status: "Complete", atTick: -4720 },
  { epoch: 3, feesIn: 0.52, liquidity: 0.18, burn: 0.1, community: 0.05, status: "Complete", atTick: -5290 },
];


// ---------------------------------------------------------------------------
// fees per epoch (chart seed — every closed epoch since genesis)
// ---------------------------------------------------------------------------

export const FEES_SERIES_SEED: FeesPoint[] = [
  { epoch: 1, fees: 0.18 }, { epoch: 2, fees: 0.31 }, { epoch: 3, fees: 0.52 },
  { epoch: 4, fees: 0.45 }, { epoch: 5, fees: 0.59 }, { epoch: 6, fees: 0.37 },
  { epoch: 7, fees: 0.83 }, { epoch: 8, fees: 0.48 }, { epoch: 9, fees: 0.64 },
  { epoch: 10, fees: 0.55 }, { epoch: 11, fees: 0.71 },
];


// ---------------------------------------------------------------------------
// activity feed
// ---------------------------------------------------------------------------

export const ACTIVITY_SEED: ActivityEntry[] = [
  { id: 8, tag: "cycle", text: "epoch #12 opened", tone: "green", atTick: -122 },
  { id: 7, tag: "reserve", text: "creator deposit received · 0.038 SOL", tone: "neutral", atTick: -180 },
  { id: 6, tag: "engine", text: "flywheel speed increased to 92%", tone: "green", atTick: -260 },
  { id: 5, tag: "burn", text: "burn tranche staged for epoch #12", tone: "amber", atTick: -410 },
  { id: 4, tag: "reserve", text: "holder tranche prepared — 0.06 SOL", tone: "neutral", atTick: -520 },
  { id: 3, tag: "engine", text: "holder-reward vault initialised", tone: "amber", atTick: -700 },
  { id: 2, tag: "cycle", text: "epoch #11 settled — 0.71 SOL routed", tone: "green", atTick: -740 },
  { id: 1, tag: "engine", text: "genesis engine ignited — public dashboard live", tone: "green", atTick: -880 },
];

// templates cycled by the simulation ticker; {r} is replaced with a jittered value
export const ACTIVITY_POOL: { tag: string; tone: ActivityEntry["tone"]; text: (r: number) => string }[] = [
  { tag: "engine", tone: "green", text: (r) => `flywheel speed holding ${(91 + r * 2).toFixed(1)}%` },
  { tag: "cycle", tone: "green", text: (r) => `buyback executed — ${(0.05 + r * 0.15).toFixed(2)} SOL swapped for $POF` },
  { tag: "burn", tone: "amber", text: (r) => `${(0.01 + r * 0.05).toFixed(3)} SOL staged for burn tranche` },
  { tag: "engine", tone: "neutral", text: () => "allocation engine rebalance check passed" },
  { tag: "cycle", tone: "green", text: (r) => `momentum sample recorded — score ${(85 + r * 4).toFixed(0)}` },
  { tag: "reserve", tone: "neutral", text: (r) => `holder tranche accruing — ${(0.03 + r * 0.05).toFixed(2)} SOL pending` },
  { tag: "engine", tone: "neutral", text: () => "public dashboard heartbeat ok" },
  { tag: "burn", tone: "amber", text: () => "burn tranche staged — settles next cycle" },
];

