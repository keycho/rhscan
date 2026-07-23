import React from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// button class recipes — keep every CTA on the same three shapes
export const btn = {
  primary:
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded bg-accent px-3.5 h-9 text-[13px] font-semibold text-accent-ink transition-colors hover:bg-[#45f6ad] disabled:opacity-50",
  outline:
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-line bg-transparent px-3.5 h-9 text-[13px] font-medium text-secondary transition-colors hover:border-accent/50 hover:text-accent",
  ghost:
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 h-8 text-[13px] font-medium text-secondary transition-colors hover:text-text hover:bg-panel2",
  small:
    "inline-flex items-center gap-1 whitespace-nowrap rounded border border-line px-2 h-7 text-2xs font-mono text-secondary transition-colors hover:border-accent/50 hover:text-accent",
};

export function Panel({
  className,
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className={cx("rounded-md border border-line bg-panel", className)}>
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  right,
  className,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-3 border-b border-line px-4 py-2.5",
        className
      )}
    >
      <div className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">{title}</div>
      {right}
    </div>
  );
}

export function SectionHead({
  index,
  title,
  right,
}: {
  index: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex items-baseline gap-2 font-mono">
        <span className="text-2xs text-accent">//{index}</span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-text">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cx("relative flex h-1.5 w-1.5", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "neutral";
  className?: string;
}) {
  const tones = {
    green: "border-accent/30 bg-accent/10 text-accent",
    amber: "border-amber/30 bg-amber/10 text-amber",
    neutral: "border-line bg-panel2 text-secondary",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-3xs uppercase tracking-[0.12em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="font-mono text-2xs uppercase tracking-wider text-muted">{label}</span>
      <span className="font-mono text-xs text-text">{value}</span>
    </div>
  );
}

// pof wordmark glyph — a six-spoke wheel echoing the flywheel diagram
export function PofMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.1" fill="currentColor" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1="12"
          y1="12"
          x2={12 + 9.5 * Math.cos((deg * Math.PI) / 180)}
          y2={12 + 9.5 * Math.sin((deg * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="1.1"
          opacity="0.55"
        />
      ))}
    </svg>
  );
}
