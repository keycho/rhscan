// honesty affordances. amber is reserved strictly for indexing-honesty signals:
// the `window` tag on window-derived totals, the `rpc` badge on data served live
// from the chain, the gini value, and the small disclosure dots. never used for
// sentences, headings, or decoration — disclosure sentences use grey text with
// only a small amber dot. green `live` dots mark real-time head lists.

import type { ReactNode } from "react";

// small amber bordered tag: `window`, `rpc`.
export function AmberTag({ children, size = 8.5 }: { children: ReactNode; size?: number }) {
  return (
    <span
      className="mono rounded-[3px] border px-1 leading-[1.5] text-amber"
      style={{ fontSize: `${size}px`, borderColor: "rgba(154,106,36,0.4)" }}
    >
      {children}
    </span>
  );
}

// the small amber disclosure dot that precedes an honesty sentence.
export function AmberDot() {
  return <span className="inline-block h-[5px] w-[5px] flex-none rounded-full bg-amber" />;
}

// pulsing green live-head dot.
export function LiveDot() {
  return <span className="live-dot inline-block h-[6px] w-[6px] flex-none rounded-full bg-green" />;
}

// the "● live" label used on real-time head cards.
export function LiveLabel() {
  return (
    <span className="flex items-center gap-[6px] text-[11px] text-label">
      <LiveDot />
      live
    </span>
  );
}

// an honesty sentence: amber dot + grey sentence, optional right-aligned mono
// note (e.g. the indexed block range).
export function HonestyLine({
  children,
  right,
  className = "",
}: {
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AmberDot />
      <span className="text-[11.5px] text-label">{children}</span>
      {right != null && <span className="mono ml-auto text-[10px] text-muted">{right}</span>}
    </div>
  );
}
