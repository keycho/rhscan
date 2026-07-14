// pure formatting helpers. no database, no rpc, no react: safe to import from
// both server and client components. everything that touches wei, token amounts
// or block numbers goes through bigint so a 78-digit value never loses precision
// to a float.

const ZERO = "0x" + "0".repeat(40);

export function isZeroAddress(a: string | null | undefined): boolean {
  return a != null && a.toLowerCase() === ZERO;
}

// 0x1234abcd…9abcdef0, keeping enough on each side to eyeball a match.
export function shortHash(h: string, head = 10, tail = 8): string {
  if (!h) return "";
  if (h.length <= head + tail + 1) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function shortAddr(a: string, head = 8, tail = 6): string {
  return shortHash(a, head, tail);
}

// group an integer string with thin separators, e.g. 1234567 -> 1,234,567.
export function groupInt(intStr: string): string {
  const neg = intStr.startsWith("-");
  const digits = neg ? intStr.slice(1) : intStr;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return neg ? `-${grouped}` : grouped;
}

export function formatNumber(n: number | bigint | string): string {
  if (typeof n === "number") {
    if (!Number.isFinite(n)) return "0";
    return groupInt(Math.trunc(n).toString());
  }
  return groupInt(BigInt(n).toString());
}

// format an integer amount of base units (value) with `decimals` implied
// fractional digits. trims trailing zeros, caps the fraction at maxFrac. all
// bigint, so it is exact for any supply.
export function formatUnits(
  value: string | bigint,
  decimals: number,
  maxFrac = 6,
): string {
  let v = typeof value === "bigint" ? value : BigInt(value || "0");
  const neg = v < 0n;
  if (neg) v = -v;
  const d = Number.isFinite(decimals) && decimals >= 0 ? decimals : 0;
  const base = 10n ** BigInt(d);
  const whole = v / base;
  const frac = v % base;
  let out = groupInt(whole.toString());
  if (d > 0 && frac > 0n) {
    let fracStr = frac.toString().padStart(d, "0");
    if (maxFrac < d) fracStr = fracStr.slice(0, maxFrac);
    fracStr = fracStr.replace(/0+$/, "");
    if (fracStr.length) out += "." + fracStr;
  }
  return neg ? `-${out}` : out;
}

// wei -> eth string. default 6 fractional digits, which is plenty for a fee.
export function formatEth(wei: string | bigint, maxFrac = 6): string {
  return formatUnits(wei, 18, maxFrac);
}

// wei -> gwei string, used for gas prices.
export function formatGwei(wei: string | bigint | null | undefined, maxFrac = 4): string {
  if (wei == null) return "0";
  return formatUnits(wei, 9, maxFrac);
}

// wei * ethUsd -> usd number, exact-ish: we only need cents, so scale by 1e6
// before dropping to a float.
export function weiToUsd(wei: string | bigint, ethUsd: number): number {
  if (!ethUsd || !Number.isFinite(ethUsd)) return 0;
  const w = typeof wei === "bigint" ? wei : BigInt(wei || "0");
  const micros = Number((w * BigInt(Math.round(ethUsd * 1e6))) / 10n ** 12n);
  return micros / 1e6;
}

export function formatUsd(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return "$0.00";
  const fixed = n.toFixed(dp);
  const [i, f] = fixed.split(".");
  return `$${groupInt(i!)}${f ? "." + f : ""}`;
}

// a compact 0.0% share from a 0..1 fraction (or null when undefined).
export function formatShare(x: number | null | undefined, dp = 1): string {
  if (x == null || !Number.isFinite(x)) return "unknown";
  return `${(x * 100).toFixed(dp)}%`;
}

export function gasPercent(used: number | null, limit: number | null): number | null {
  if (!used || !limit || limit <= 0) return null;
  return (used / limit) * 100;
}

// relative time from an iso string. `nowMs` is injected so a server render and a
// client tick stay deterministic. sub-minute resolution matters: this chain does
// ~10 blocks/second, so "12s ago" is the common case.
export function timeAgo(iso: string, nowMs: number = Date.now()): string {
  const then = new Date(iso).getTime();
  let s = Math.floor((nowMs - then) / 1000);
  if (Number.isNaN(s)) return "";
  if (s < 0) s = 0;
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h ago`;
}

export function formatUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // 2026-07-14 18:03:22 UTC
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

// a 4-byte method id as 0x-hex, or a friendly label for the empty selector.
export function formatMethodId(methodId: string | null): string {
  if (!methodId || methodId === "0x") return "transfer";
  return methodId;
}
