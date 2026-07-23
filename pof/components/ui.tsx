import React from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// bagwork-style button recipes: rectangular, mono, pressed states
export const btn = {
  solid:
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-accent bg-accent px-3.5 h-9 text-xs font-bold text-accent-ink transition hover:bg-[#71f5a3] active:translate-y-px",
  outline:
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-line-strong bg-transparent px-3.5 h-9 text-xs font-medium text-secondary transition hover:border-accent hover:text-accent active:translate-y-px",
  small:
    "inline-flex items-center gap-1 whitespace-nowrap rounded border border-line px-2 h-7 text-2xs text-secondary transition hover:border-accent hover:text-accent active:translate-y-px",
};

export function Card({
  className,
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className={cx("rounded border border-line bg-panel", className)}>
      {children}
    </div>
  );
}

export function SectionHead({
  title,
  right,
  tone = "amber",
}: {
  title: string;
  right?: React.ReactNode;
  tone?: "amber" | "green";
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2
        className={cx(
          "text-base font-bold lowercase",
          tone === "amber" ? "text-amber" : "text-accent"
        )}
      >
        {title}
      </h2>
      {right ? <div className="text-3xs text-faint">{right}</div> : null}
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
    green: "border-accent/40 text-accent",
    amber: "border-amber/40 text-amber",
    neutral: "border-line-strong text-secondary",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-3xs lowercase",
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
      <span className="text-2xs lowercase text-muted">{label}</span>
      <span className="text-xs text-text">{value}</span>
    </div>
  );
}

// pof glyph — a six-spoke wheel
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
