export type EngineMode =
  | "Momentum"
  | "Stability"
  | "Growth"
  | "Defensive"
  | "Community";

export type CycleStatus = "Processing" | "Complete";

export interface Cycle {
  epoch: number;
  feesIn: number;
  liquidity: number;
  burn: number;
  community: number;
  status: CycleStatus;
  /** tick (seconds since page load, negative = before load) the cycle opened */
  atTick: number;
}

export type ActivityTone = "green" | "amber" | "neutral";

export interface ActivityEntry {
  id: number;
  tag: string;
  text: string;
  tone: ActivityTone;
  atTick: number;
}

export interface AllocationSlice {
  key: string;
  label: string;
  pct: number;
  color: string;
}

export interface Toast {
  id: number;
  message: string;
  tone: "success" | "info";
}

export interface FeesPoint {
  epoch: number;
  fees: number;
}

export interface DraftToken {
  name: string;
  symbol: string;
  mint: string;
  /** true when this is the offered demonstration token, not a creator token */
  demo: boolean;
}

/** a flywheel preview created in the demo wizard — config state only, never a transaction */
export interface FlywheelDraft {
  owner: string;
  token: DraftToken;
  mode: EngineMode;
  weights: { key: string; label: string; pct: number; color: string }[];
  plannedDeposit: number;
  slippagePct: number;
  treasury: string;
  createdAt: number;
  status: "draft";
}
