// holder-distribution analytics, derived purely from the indexed top-holder
// balances and the token's total supply. concentration (top-N share) and the
// donut segments only need the top holders' balances relative to supply, so they
// are exact regardless of the total holder count. the gini index and the tier
// distribution are computed over the holders we actually hold (up to the indexed
// top-N); they carry an amber honesty tag and an "across the top N holders" note
// in the ui, because they approximate a distribution we do not fully index.

import type { Holder } from "@/src/holders";

// the donut segment ramp from the design tokens.
export const RAMP = ["#0c8f4f", "#37b877", "#7fd3a6", "#b8e6cf", "#5ec9de", "#cfc7b5"] as const;

export interface ConcentrationSegment {
  label: string;
  pct: number; // 0..100
  color: string;
}

export interface TierRow {
  emoji: string;
  label: string;
  pct: number; // share of the analysed holders, 0..100
  count: number;
}

export interface HolderAnalytics {
  analysed: number; // how many holders these figures cover
  exact: boolean; // true when we hold every holder (analysed >= holderCount)
  top5: number | null;
  top10: number | null;
  top25: number | null;
  top50: number | null;
  top100: number | null;
  gini: number | null;
  giniLabel: string;
  concentration: ConcentrationSegment[];
  tiers: TierRow[];
}

// balance / total as a fraction in [0, 1], computed with bigint for precision.
function frac(balance: bigint, total: bigint): number {
  if (total <= 0n) return 0;
  return Number((balance * 1_000_000_000n) / total) / 1e9;
}

// sum of the first n fractions, as a percentage.
function topPct(fracs: number[], n: number): number | null {
  if (fracs.length === 0) return null;
  const slice = fracs.slice(0, n);
  return slice.reduce((a, b) => a + b, 0) * 100;
}

// gini over the provided fractions (sorted-formula, 1-indexed ascending).
function gini(fracs: number[]): number | null {
  const xs = fracs.filter((x) => x > 0).sort((a, b) => a - b);
  const n = xs.length;
  if (n < 2) return null;
  const sum = xs.reduce((a, b) => a + b, 0);
  if (sum <= 0) return null;
  let cum = 0;
  for (let i = 0; i < n; i += 1) cum += (i + 1) * xs[i]!;
  const g = (2 * cum) / (n * sum) - (n + 1) / n;
  return Math.max(0, Math.min(1, g));
}

function giniLabel(g: number | null): string {
  if (g == null) return "insufficient data";
  if (g >= 0.9) return "highly concentrated";
  if (g >= 0.75) return "very concentrated";
  if (g >= 0.55) return "concentrated";
  if (g >= 0.35) return "moderately spread";
  return "broadly distributed";
}

// size tiers by each holder's share of supply. standard crypto analytics tiers.
const TIER_DEFS: { emoji: string; label: string; min: number }[] = [
  { emoji: "🐋", label: "whale", min: 0.01 }, // >= 1%
  { emoji: "🦈", label: "shark", min: 0.001 }, // 0.1% – 1%
  { emoji: "🐬", label: "dolphin", min: 0.0001 }, // 0.01% – 0.1%
  { emoji: "🐟", label: "fish", min: 0.00001 }, // 0.001% – 0.01%
  { emoji: "🦀", label: "crab", min: 0.000001 }, // 0.0001% – 0.001%
  { emoji: "🦐", label: "shrimp", min: 0 }, // < 0.0001%
];

export function holderAnalytics(
  holders: Holder[],
  totalSupply: string | null,
  holderCount: number | null,
): HolderAnalytics | null {
  if (!totalSupply) return null;
  const total = BigInt(totalSupply);
  if (total <= 0n || holders.length === 0) return null;

  const fracs = holders
    .map((h) => frac(BigInt(h.balance), total))
    .sort((a, b) => b - a); // descending

  const analysed = fracs.length;
  const exact = holderCount == null ? true : analysed >= holderCount;

  // donut / concentration bands.
  const band = (lo: number, hi: number) =>
    fracs.slice(lo, hi).reduce((a, b) => a + b, 0) * 100;
  const top100 = topPct(fracs, 100) ?? 0;
  const bands = [
    { label: "top 1–5", pct: band(0, 5) },
    { label: "top 6–10", pct: band(5, 10) },
    { label: "top 11–25", pct: band(10, 25) },
    { label: "top 26–50", pct: band(25, 50) },
    { label: "top 51–100", pct: band(50, 100) },
    { label: "others", pct: Math.max(0, 100 - top100) },
  ];
  const concentration: ConcentrationSegment[] = bands.map((b, i) => ({
    label: b.label,
    pct: b.pct,
    color: RAMP[i]!,
  }));

  // tier distribution over the analysed holders.
  const counts = TIER_DEFS.map(() => 0);
  for (const f of fracs) {
    const idx = TIER_DEFS.findIndex((t) => f >= t.min);
    counts[idx === -1 ? TIER_DEFS.length - 1 : idx] += 1;
  }
  const tiers: TierRow[] = TIER_DEFS.map((t, i) => ({
    emoji: t.emoji,
    label: t.label,
    count: counts[i]!,
    pct: analysed > 0 ? (counts[i]! / analysed) * 100 : 0,
  }));

  const g = gini(fracs);

  return {
    analysed,
    exact,
    top5: topPct(fracs, 5),
    top10: topPct(fracs, 10),
    top25: topPct(fracs, 25),
    top50: topPct(fracs, 50),
    top100,
    gini: g,
    giniLabel: giniLabel(g),
    concentration,
    tiers,
  };
}
