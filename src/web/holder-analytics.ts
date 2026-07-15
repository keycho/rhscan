// holder-distribution analytics, derived purely from the indexed top-holder
// balances and the token's total supply. no external calls, no new data source.
//
// every metric is measured against a basis: the token's total supply when it is
// known, otherwise the sum of the indexed holder balances we hold. this is the
// same honest fallback the holders-table percentage column uses — when supply is
// unresolved we say so and label the figures "of indexed balances" rather than
// pretending they are shares of supply.
//
// what is exact vs approximate: holders are ranked by balance and we hold the top
// N, so the top-N concentration bands and the donut are exact shares of the basis
// regardless of the total holder count, and the larger size tiers are complete.
// the gini index and the smallest tiers are computed over the holders we actually
// index (up to the top N); they carry an amber honesty tag and an "across the top
// N holders" note in the ui.

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
  threshold: string; // human threshold, e.g. ">= 1%"
  pct: number; // this tier's share of the basis, 0..100
  count: number; // holders in this tier (within the analysed set)
}

export interface HolderAnalytics {
  analysed: number; // how many holders these figures cover
  exact: boolean; // true when we hold every holder (analysed >= holderCount)
  supplyKnown: boolean; // basis is total supply (true) or sum of indexed balances (false)
  basisLabel: string; // "supply" | "indexed balances" — for honest ui copy
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

// balances arrive from the db as integer (wei) strings; guard against a stray
// non-numeric value rather than throwing and 500-ing the whole page.
function toBig(s: string): bigint {
  try {
    return BigInt(s);
  } catch {
    return 0n;
  }
}

// balance / basis as a fraction in [0, 1], computed with bigint for precision.
function frac(balance: bigint, basis: bigint): number {
  if (basis <= 0n) return 0;
  return Number((balance * 1_000_000_000n) / basis) / 1e9;
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

// plain-language bands: <=0.4 well distributed, 0.4–0.7 moderately concentrated,
// >0.7 highly concentrated.
function giniLabel(g: number | null): string {
  if (g == null) return "insufficient data";
  if (g > 0.7) return "highly concentrated";
  if (g >= 0.4) return "moderately concentrated";
  return "well distributed";
}

// size tiers by each holder's share of the basis. standard crypto analytics tiers.
const TIER_DEFS: { emoji: string; label: string; threshold: string; min: number }[] = [
  { emoji: "🐋", label: "whale", threshold: "≥ 1%", min: 0.01 },
  { emoji: "🦈", label: "shark", threshold: "0.1 – 1%", min: 0.001 },
  { emoji: "🐬", label: "dolphin", threshold: "0.01 – 0.1%", min: 0.0001 },
  { emoji: "🐟", label: "fish", threshold: "0.001 – 0.01%", min: 0.00001 },
  { emoji: "🦀", label: "crab", threshold: "0.0001 – 0.001%", min: 0.000001 },
  { emoji: "🦐", label: "shrimp", threshold: "< 0.0001%", min: 0 },
];

export function holderAnalytics(
  holders: Holder[],
  totalSupply: string | null,
  holderCount: number | null,
): HolderAnalytics | null {
  if (holders.length === 0) return null;

  // descending balances, positive only. the query returns them ranked, but sort
  // defensively so the top-N bands are correct regardless of caller ordering.
  const balances = holders
    .map((h) => toBig(h.balance))
    .filter((b) => b > 0n)
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  if (balances.length === 0) return null;

  const supply = totalSupply ? toBig(totalSupply) : 0n;
  const sumIndexed = balances.reduce((a, b) => a + b, 0n);
  const supplyKnown = supply > 0n;
  // basis: total supply when known, else the sum of the indexed balances.
  const basis = supplyKnown ? supply : sumIndexed;
  if (basis <= 0n) return null;

  const fracs = balances.map((b) => frac(b, basis)); // descending

  const analysed = balances.length;
  const exact = holderCount == null ? true : analysed >= holderCount;

  // donut / concentration bands (share of basis, exact for the top-N holders).
  const band = (lo: number, hi: number) => fracs.slice(lo, hi).reduce((a, b) => a + b, 0) * 100;
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

  // tier distribution: assign each holder to a tier by its share of the basis,
  // and show each tier's *aggregate* share of the basis (summed in bigint so many
  // small holders do not accumulate float error).
  const tierBal = TIER_DEFS.map(() => 0n);
  const tierCount = TIER_DEFS.map(() => 0);
  for (let i = 0; i < balances.length; i += 1) {
    const f = fracs[i]!;
    let idx = TIER_DEFS.findIndex((t) => f >= t.min);
    if (idx === -1) idx = TIER_DEFS.length - 1;
    tierBal[idx] = tierBal[idx]! + balances[i]!;
    tierCount[idx] = tierCount[idx]! + 1;
  }
  const tiers: TierRow[] = TIER_DEFS.map((t, i) => ({
    emoji: t.emoji,
    label: t.label,
    threshold: t.threshold,
    count: tierCount[i]!,
    pct: Number((tierBal[i]! * 1_000_000n) / basis) / 10_000,
  }));

  const g = gini(fracs);

  return {
    analysed,
    exact,
    supplyKnown,
    basisLabel: supplyKnown ? "supply" : "indexed balances",
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
