// canonical links and hash rendering. everything hex is monospace and truncated
// to a scannable head+tail; the full value stays in the title attribute.

import Link from "next/link";
import { shortAddr, shortHash } from "@/src/web/format";

export function TxLink({ hash, short = true }: { hash: string; short?: boolean }) {
  return (
    <Link href={`/tx/${hash}`} className="mono" title={hash}>
      {short ? shortHash(hash) : hash}
    </Link>
  );
}

export function BlockLink({ number }: { number: number }) {
  return (
    <Link href={`/block/${number}`} className="mono">
      {number.toLocaleString("en-US")}
    </Link>
  );
}

export function AddrLink({
  address,
  short = true,
  isToken = false,
  label,
}: {
  address: string;
  short?: boolean;
  isToken?: boolean;
  label?: string;
}) {
  if (!address) return <span className="text-faint">-</span>;
  const href = isToken ? `/token/${address}` : `/address/${address}`;
  return (
    <Link href={href} className="mono" title={address}>
      {label ?? (short ? shortAddr(address) : address)}
    </Link>
  );
}

export function TokenLink({
  address,
  children,
}: {
  address: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={`/token/${address}`} className="mono" title={address}>
      {children ?? shortAddr(address)}
    </Link>
  );
}

// in / out arrow tag for an address's transaction direction. amber is reserved
// for honesty signals, so "out" is neutral-bordered and "in" is green.
export function DirectionTag({ direction }: { direction: string }) {
  const out = direction === "from";
  return (
    <span
      className={`inline-block w-9 rounded border px-1 py-0.5 text-center text-2xs font-medium leading-none ${
        out ? "border-border bg-surface text-tertiary" : "border-green/40 bg-green/10 text-green"
      }`}
    >
      {out ? "out" : "in"}
    </span>
  );
}
