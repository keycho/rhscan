"use client";

// relative time that ticks. the chain does ~10 blocks/second, so seconds matter.
// the server renders the initial relative string from the iso timestamp; the
// client re-derives it on a 1s interval. hydration warnings are suppressed on the
// text node because the two renders can differ by a second by design.

import { useEffect, useState } from "react";
import { formatUtc, timeAgo } from "@/src/web/format";

export function TimeAgo({ iso, className = "" }: { iso: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!iso) return <span className={className}>-</span>;
  // on the server render (now === null) fall back to the current time so the
  // initial html shows a real relative age, not "0s ago".
  const text = timeAgo(iso, now ?? Date.now());
  return (
    <span className={className} title={formatUtc(iso)} suppressHydrationWarning>
      {text}
    </span>
  );
}
