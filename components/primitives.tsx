// small server-rendered layout primitives. dark, dense, bordered panels and a
// two-column key/value grid for detail pages. no client javascript.

import type { ReactNode } from "react";

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
    <section className={`rounded border border-border bg-panel ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <h2 className="text-[13px] font-semibold tracking-wide text-text">{title}</h2>
          {right ? <div className="text-xs text-muted">{right}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}

// a detail row: fixed label column, value flows. label wraps under the value on
// narrow screens.
export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border/60 px-4 py-2.5 last:border-0 sm:grid-cols-[220px_1fr] sm:gap-4">
      <div className="text-xs text-muted sm:pt-0.5">{label}</div>
      <div className="min-w-0 break-words text-[13px] text-text">{children}</div>
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
    neutral: "border-border bg-panel2 text-muted",
    ok: "border-ok/40 bg-ok/10 text-ok",
    bad: "border-bad/40 bg-bad/10 text-bad",
    warn: "border-warn/40 bg-warn/10 text-warn",
    accent: "border-accent/40 bg-accent/10 text-accent",
  };
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs font-medium leading-none ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Muted({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`text-muted ${className}`}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-center text-sm text-faint">{children}</div>;
}

// a horizontally scrollable wrapper so wide tables scroll inside the panel and
// never push the page body sideways.
export function ScrollX({ children }: { children: ReactNode }) {
  return <div className="scroll-x">{children}</div>;
}
