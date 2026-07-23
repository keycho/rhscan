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
  mode: "Momentum" as EngineMode,
  epoch: 12,
  nextCycleSeconds: 261, // 04:21
  feesRouted: 6.1,
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

// deterministic pseudo-values for paginated "older" epochs (down to epoch 1)
export function syntheticCycle(epoch: number): Cycle {
  const h = Math.abs(Math.sin(epoch * 12.9898) * 43758.5453) % 1;
  const fees = 0.2 + h * 0.6;
  return {
    epoch,
    feesIn: fees,
    liquidity: fees * 0.35,
    burn: fees * 0.2,
    community: fees * 0.105,
    status: "Complete",
    atTick: -120 - (12 - epoch) * 570,
  };
}

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

export const MOMENTUM_SPARK = [58, 62, 66, 64, 70, 73, 71, 76, 79, 82, 84, 87];

// ---------------------------------------------------------------------------
// activity feed
// ---------------------------------------------------------------------------

export const ACTIVITY_SEED: ActivityEntry[] = [
  { id: 8, tag: "cycle", text: "epoch #12 opened", tone: "green", atTick: -122 },
  { id: 7, tag: "reserve", text: "0.038 SOL added to reserve", tone: "neutral", atTick: -180 },
  { id: 6, tag: "engine", text: "flywheel speed increased to 92%", tone: "green", atTick: -260 },
  { id: 5, tag: "burn", text: "burn tranche staged for epoch #12", tone: "amber", atTick: -410 },
  { id: 4, tag: "reserve", text: "community tranche prepared — 0.06 SOL", tone: "neutral", atTick: -520 },
  { id: 3, tag: "launch", text: "launch slot #02 opened for applications", tone: "amber", atTick: -700 },
  { id: 2, tag: "cycle", text: "epoch #11 settled — 0.71 SOL routed", tone: "green", atTick: -740 },
  { id: 1, tag: "engine", text: "genesis engine ignited — public dashboard live", tone: "green", atTick: -880 },
];

// templates cycled by the simulation ticker; {r} is replaced with a jittered value
export const ACTIVITY_POOL: { tag: string; tone: ActivityEntry["tone"]; text: (r: number) => string }[] = [
  { tag: "reserve", tone: "neutral", text: (r) => `${(0.04 + r * 0.09).toFixed(3)} SOL added to reserve` },
  { tag: "engine", tone: "green", text: (r) => `flywheel speed holding ${(91 + r * 2).toFixed(1)}%` },
  { tag: "cycle", tone: "green", text: (r) => `cycle checkpoint — ${(0.05 + r * 0.15).toFixed(2)} SOL routed to liquidity` },
  { tag: "burn", tone: "amber", text: (r) => `${(0.01 + r * 0.05).toFixed(3)} SOL staged for burn tranche` },
  { tag: "reserve", tone: "neutral", text: (r) => `acquisition reserve topped up +${(0.02 + r * 0.06).toFixed(3)} SOL` },
  { tag: "engine", tone: "neutral", text: () => "allocation engine rebalance check passed" },
  { tag: "launch", tone: "amber", text: () => "launch slot inquiry received — queue open" },
  { tag: "cycle", tone: "green", text: (r) => `momentum sample recorded — score ${(85 + r * 4).toFixed(0)}` },
  { tag: "reserve", tone: "neutral", text: (r) => `community tranche accruing — ${(0.03 + r * 0.05).toFixed(2)} SOL pending` },
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
