// shared layout primitives for the light, dense design: a page container, white
// bordered cards, key/value rows, tags, and a horizontal-scroll wrapper. hairline
// borders instead of shadows. no client javascript.

import type { ReactNode } from "react";

// the 1280px content column with the design's 22px horizontal padding.
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto max-w-page px-[22px] ${className}`}>{children}</div>;
}

// a white card with a hairline outline. optional header with a title and a
// right-aligned slot.
export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-lg border border-border-strong bg-surface ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-border-hair px-4 py-3">
          <h2 className="text-[13.5px] font-semibold text-text">{title}</h2>
          {right ? <div className="text-xs text-label">{right}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}

// a detail row used on the block/tx/address pages: fixed label column, value
// flows. hairline dividers.
export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border-hair px-4 py-3 last:border-0 sm:grid-cols-[220px_1fr] sm:gap-4">
      <div className="text-xs text-label sm:pt-0.5">{label}</div>
      <div className="min-w-0 break-words text-[13px] text-text">{children}</div>
    </div>
  );
}

// a compact key/value row (label left, value right) used inside the token-detail
// overview/activity cards.
export function KV({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-hair px-4 py-3 last:border-0">
      <span className="text-[12px] text-label">{label}</span>
      <span className="min-w-0 text-right text-[12.5px] text-text">{children}</span>
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
  title,
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "bad" | "warn" | "accent";
  title?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-border bg-surface text-tertiary",
    ok: "border-green/40 bg-green/10 text-green",
    bad: "border-bad/40 bg-bad/10 text-bad",
    warn: "border-amber/40 bg-amber/10 text-amber",
    accent: "border-green/40 bg-green/10 text-green",
  };
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-[5px] border px-[9px] py-[3px] text-[11px] font-medium leading-none ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Muted({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`text-label ${className}`}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-center text-sm text-muted">{children}</div>;
}

// a horizontally scrollable wrapper so wide tables scroll inside the panel and
// never push the page body sideways.
export function ScrollX({ children }: { children: ReactNode }) {
  return <div className="scroll-x">{children}</div>;
}
