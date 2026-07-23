import type {
  ActivityEntry,
  AllocationSlice,
  Cycle,
  EngineMode,
  FeesPoint,
  UserEngine,
  UserProfile,
  WalletState,
} from "@/types";

// ---------------------------------------------------------------------------
// genesis engine
// ---------------------------------------------------------------------------

// note: reserve balances are deliberately NOT mocked. a reserve balance is a
// claim about real held funds, so the UI renders "—" with "publishes on-chain
// at launch" until an engine reports real balances.
export const GENESIS = {
  tokenName: "Genesis Wheel",
  ticker: "$POF",
  status: "Live",
  engineId: "001",
  network: "Solana",
  platform: "Pump.fun",
  mode: "Momentum" as EngineMode,
  epoch: 184,
  nextCycleSeconds: 261, // 04:21
  feesRouted: 184.2,
  totalCycles: 382,
  flywheelSpeed: 92,
  momentumScore: 87,
  totalRoutedValue: "$84.2K",
  tokensRouted: "12.4M",
  burnedSupply: "3.42M",
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
    { key: "acq", label: "Acquisition Reserve", pct: 25, color: SERIES.blue },
    { key: "burn", label: "Burn Reserve", pct: 20, color: SERIES.amber },
    { key: "comm", label: "Community", pct: 10, color: SERIES.magenta },
    { key: "trea", label: "Treasury", pct: 10, color: SERIES.violet },
  ],
  Stability: [
    { key: "liq", label: "Liquidity", pct: 45, color: SERIES.green },
    { key: "acq", label: "Acquisition Reserve", pct: 15, color: SERIES.blue },
    { key: "burn", label: "Burn Reserve", pct: 10, color: SERIES.amber },
    { key: "comm", label: "Community", pct: 10, color: SERIES.magenta },
    { key: "trea", label: "Treasury", pct: 20, color: SERIES.violet },
  ],
  Growth: [
    { key: "liq", label: "Liquidity", pct: 30, color: SERIES.green },
    { key: "acq", label: "Acquisition Reserve", pct: 35, color: SERIES.blue },
    { key: "burn", label: "Burn Reserve", pct: 15, color: SERIES.amber },
    { key: "comm", label: "Community", pct: 10, color: SERIES.magenta },
    { key: "trea", label: "Treasury", pct: 10, color: SERIES.violet },
  ],
  Defensive: [
    { key: "liq", label: "Liquidity", pct: 50, color: SERIES.green },
    { key: "acq", label: "Acquisition Reserve", pct: 10, color: SERIES.blue },
    { key: "burn", label: "Burn Reserve", pct: 5, color: SERIES.amber },
    { key: "comm", label: "Community", pct: 10, color: SERIES.magenta },
    { key: "trea", label: "Treasury", pct: 25, color: SERIES.violet },
  ],
  Community: [
    { key: "liq", label: "Liquidity", pct: 30, color: SERIES.green },
    { key: "acq", label: "Acquisition Reserve", pct: 15, color: SERIES.blue },
    { key: "burn", label: "Burn Reserve", pct: 15, color: SERIES.amber },
    { key: "comm", label: "Community", pct: 30, color: SERIES.magenta },
    { key: "trea", label: "Treasury", pct: 10, color: SERIES.violet },
  ],
};

export const MODE_NOTES: Record<EngineMode, string> = {
  Momentum: "aggressive routing into liquidity + acquisition. built for velocity.",
  Stability: "liquidity-heavy split with a deeper treasury floor.",
  Growth: "acquisition-weighted. reserves compound into buy-side pressure.",
  Defensive: "max liquidity + treasury. slows the wheel, hardens the floor.",
  Community: "routes a triple tranche to holders and community programs.",
};

// ---------------------------------------------------------------------------
// cycle timeline — atTick is seconds relative to page load (negative = past)
// ---------------------------------------------------------------------------

export const CYCLE_SEED: Cycle[] = [
  { epoch: 184, feesIn: 3.82, liquidity: 1.34, burn: 0.82, community: 0.41, status: "Processing", atTick: -120 },
  { epoch: 183, feesIn: 4.1, liquidity: 1.44, burn: 0.88, community: 0.44, status: "Complete", atTick: -720 },
  { epoch: 182, feesIn: 2.71, liquidity: 0.95, burn: 0.58, community: 0.29, status: "Complete", atTick: -1260 },
  { epoch: 181, feesIn: 3.24, liquidity: 1.13, burn: 0.69, community: 0.35, status: "Complete", atTick: -1830 },
  { epoch: 180, feesIn: 4.62, liquidity: 1.62, burn: 0.97, community: 0.49, status: "Complete", atTick: -2410 },
  { epoch: 179, feesIn: 3.05, liquidity: 1.07, burn: 0.64, community: 0.33, status: "Complete", atTick: -2980 },
  { epoch: 178, feesIn: 2.44, liquidity: 0.85, burn: 0.52, community: 0.26, status: "Complete", atTick: -3560 },
  { epoch: 177, feesIn: 3.91, liquidity: 1.37, burn: 0.83, community: 0.42, status: "Complete", atTick: -4140 },
  { epoch: 176, feesIn: 3.48, liquidity: 1.22, burn: 0.74, community: 0.37, status: "Complete", atTick: -4720 },
  { epoch: 175, feesIn: 2.96, liquidity: 1.04, burn: 0.63, community: 0.31, status: "Complete", atTick: -5290 },
];

// deterministic pseudo-values for paginated "older" epochs
export function syntheticCycle(epoch: number): Cycle {
  const h = Math.abs(Math.sin(epoch * 12.9898) * 43758.5453) % 1;
  const fees = 2.2 + h * 2.6;
  return {
    epoch,
    feesIn: fees,
    liquidity: fees * 0.35,
    burn: fees * 0.2,
    community: fees * 0.105,
    status: "Complete",
    atTick: -5290 - (184 - epoch) * 570,
  };
}

// ---------------------------------------------------------------------------
// fees per epoch (chart seed — last 24 closed epochs)
// ---------------------------------------------------------------------------

export const FEES_SERIES_SEED: FeesPoint[] = [
  { epoch: 160, fees: 2.31 }, { epoch: 161, fees: 2.64 }, { epoch: 162, fees: 2.48 },
  { epoch: 163, fees: 3.02 }, { epoch: 164, fees: 2.86 }, { epoch: 165, fees: 3.35 },
  { epoch: 166, fees: 2.92 }, { epoch: 167, fees: 3.58 }, { epoch: 168, fees: 3.21 },
  { epoch: 169, fees: 3.74 }, { epoch: 170, fees: 3.4 }, { epoch: 171, fees: 2.88 },
  { epoch: 172, fees: 3.12 }, { epoch: 173, fees: 3.66 }, { epoch: 174, fees: 3.29 },
  { epoch: 175, fees: 2.96 }, { epoch: 176, fees: 3.48 }, { epoch: 177, fees: 3.91 },
  { epoch: 178, fees: 2.44 }, { epoch: 179, fees: 3.05 }, { epoch: 180, fees: 4.62 },
  { epoch: 181, fees: 3.24 }, { epoch: 182, fees: 2.71 }, { epoch: 183, fees: 4.1 },
];

// ---------------------------------------------------------------------------
// momentum / health
// ---------------------------------------------------------------------------

export const HEALTH_METRICS = [
  { key: "momentum", label: "Momentum Score", value: 87, badge: "Strong" },
  { key: "liquidity", label: "Liquidity Strength", value: 82, badge: "Strong" },
  { key: "reserve", label: "Reserve Health", value: 91, badge: "Strong" },
  { key: "consistency", label: "Cycle Consistency", value: 76, badge: "Stable" },
  { key: "velocity", label: "Community Velocity", value: 64, badge: "Rising" },
  { key: "stability", label: "Engine Stability", value: 88, badge: "Strong" },
] as const;

export const MOMENTUM_SPARK = [74, 76, 75, 79, 78, 81, 80, 83, 82, 84, 83, 86, 85, 87];

// ---------------------------------------------------------------------------
// activity feed
// ---------------------------------------------------------------------------

export const ACTIVITY_SEED: ActivityEntry[] = [
  { id: 8, tag: "cycle", text: "epoch #184 opened", tone: "green", atTick: -122 },
  { id: 7, tag: "reserve", text: "0.084 SOL added to reserve", tone: "neutral", atTick: -180 },
  { id: 6, tag: "engine", text: "flywheel speed increased to 92%", tone: "green", atTick: -260 },
  { id: 5, tag: "burn", text: "burn tranche staged for epoch #184", tone: "amber", atTick: -410 },
  { id: 4, tag: "reserve", text: "community tranche prepared — 0.41 SOL", tone: "neutral", atTick: -520 },
  { id: 3, tag: "launch", text: "launch slot #02 opened for applications", tone: "amber", atTick: -700 },
  { id: 2, tag: "cycle", text: "epoch #183 settled — 4.10 SOL routed", tone: "green", atTick: -740 },
  { id: 1, tag: "docs", text: "public engine docs published", tone: "neutral", atTick: -880 },
];

// templates cycled by the simulation ticker; {r} is replaced with a jittered value
export const ACTIVITY_POOL: { tag: string; tone: ActivityEntry["tone"]; text: (r: number) => string }[] = [
  { tag: "reserve", tone: "neutral", text: (r) => `${(0.04 + r * 0.09).toFixed(3)} SOL added to reserve` },
  { tag: "engine", tone: "green", text: (r) => `flywheel speed holding ${(91 + r * 2).toFixed(1)}%` },
  { tag: "cycle", tone: "green", text: (r) => `cycle checkpoint — ${(0.2 + r * 0.5).toFixed(2)} SOL routed to liquidity` },
  { tag: "burn", tone: "amber", text: (r) => `${(0.01 + r * 0.05).toFixed(3)} SOL staged for burn tranche` },
  { tag: "reserve", tone: "neutral", text: (r) => `acquisition reserve topped up +${(0.02 + r * 0.06).toFixed(3)} SOL` },
  { tag: "engine", tone: "neutral", text: () => "allocation engine rebalance check passed" },
  { tag: "launch", tone: "amber", text: () => "launch slot inquiry received — queue open" },
  { tag: "cycle", tone: "green", text: (r) => `momentum sample recorded — score ${(85 + r * 4).toFixed(0)}` },
  { tag: "reserve", tone: "neutral", text: (r) => `community tranche accruing — ${(0.3 + r * 0.2).toFixed(2)} SOL pending` },
  { tag: "engine", tone: "neutral", text: () => "public dashboard heartbeat ok" },
  { tag: "burn", tone: "amber", text: () => "burn tranche staged — settles next cycle" },
  { tag: "launch", tone: "amber", text: () => "genesis template forked to draft engine" },
];

// ---------------------------------------------------------------------------
// launch slots
// ---------------------------------------------------------------------------

export const SLOTS = [
  { id: "engine_001", label: "Genesis Engine", status: "Live", tone: "live" as const, note: "genesis wheel · $POF" },
  { id: "slot_02", label: "Slot #02", status: "Available", tone: "open" as const, note: "next launch window — today" },
  { id: "slot_03", label: "Slot #03", status: "Available", tone: "open" as const, note: "applications open" },
  { id: "slot_04", label: "Slot #04", status: "Available", tone: "open" as const, note: "applications open" },
  { id: "slot_05", label: "Slot #05", status: "Reserved", tone: "reserved" as const, note: "reserved for launch" },
];

export const SLOT_STATS = [
  { label: "Active Engines", value: "1" },
  { label: "Open Slots", value: "9" },
  { label: "Applications", value: "Open" },
  { label: "Next Launch Window", value: "Today" },
];

// ---------------------------------------------------------------------------
// why tokens use pof
// ---------------------------------------------------------------------------

export const FEATURES = [
  { icon: "LayoutDashboard", title: "Public flywheel dashboard", text: "a live terminal your holders can watch. proof that the engine is alive." },
  { icon: "RefreshCw", title: "Transparent cycles", text: "every epoch settled in the open. fees in, allocations out." },
  { icon: "Vault", title: "Reserve visibility", text: "liquidity, burn and community reserves tracked in real time." },
  { icon: "GitBranch", title: "Allocation logic", text: "weighted routing you configure once and publish forever." },
  { icon: "Gauge", title: "Engine modes", text: "momentum, stability, growth, defensive, community. switch anytime." },
  { icon: "Rocket", title: "Launch-ready templates", text: "fork the genesis config. your engine live in one cycle." },
  { icon: "Users", title: "Community-facing proofs", text: "milestones, tranches and burns your community can verify." },
  { icon: "PlugZap", title: "Token onboarding", text: "paste an address, pick a mode, claim a slot. that's the setup." },
];

// ---------------------------------------------------------------------------
// docs
// ---------------------------------------------------------------------------

export const DOCS = [
  { title: "Engine setup guide", meta: "v0.4 · 6 min read" },
  { title: "Allocation modes", meta: "v0.4 · 4 min read" },
  { title: "Launch requirements", meta: "v0.3 · 3 min read" },
  { title: "Dashboard modules", meta: "v0.4 · 5 min read" },
  { title: "Public page examples", meta: "gallery · updated 2d ago" },
];

// ---------------------------------------------------------------------------
// auth / wallet mocks
// ---------------------------------------------------------------------------

export const DEMO_PROFILE: UserProfile = {
  name: "genesis operator",
  username: "@wheeloperator",
  role: "Engine Admin",
  plan: "Genesis",
};

export const DEMO_WALLET: Omit<WalletState, "provider"> = {
  address: "7pOF...wheeL",
  balance: 18.42,
  network: "Solana",
};

export const DEMO_FULL_ADDRESS = "7pOFxDEMO1111111111111111111111111111wheeL";

export const WALLETS = [
  { name: "Phantom", initial: "P", color: "#ab9ff2" },
  { name: "Solflare", initial: "S", color: "#fc9d43" },
  { name: "Backpack", initial: "B", color: "#e33e3f" },
  { name: "Coinbase Wallet", initial: "C", color: "#3773f5" },
  { name: "WalletConnect", initial: "W", color: "#3b99fc" },
];

export const SEED_ENGINES: UserEngine[] = [
  { id: "genesis", name: "Genesis Engine", statusLabel: "Live", status: "live", mode: "Momentum", slug: "genesis" },
  { id: "draft-1", name: "Draft Engine", statusLabel: "Configuration incomplete", status: "draft", mode: "Stability", slug: "draft-engine" },
];

export const CYCLE_TRIGGERS = ["every 30 min", "every 100 trades", "fee threshold · 1 SOL"];
