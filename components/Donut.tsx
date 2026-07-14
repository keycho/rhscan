// holder-concentration donut. an SVG ring rotated -90° so segments start at 12
// o'clock, each segment drawn with stroke-dasharray / stroke-dashoffset from the
// cumulative share. track and segments come from the concentration ramp.

import type { ConcentrationSegment } from "@/src/web/holder-analytics";

export function Donut({ segments, size = 120 }: { segments: ConcentrationSegment[]; size?: number }) {
  const r = 48;
  const c = 2 * Math.PI * r;
  let cum = 0;

  return (
    <svg
      viewBox="0 0 128 128"
      style={{ width: size, height: size, flex: "none", transform: "rotate(-90deg)" }}
      role="img"
      aria-label="holder concentration"
    >
      <circle cx="64" cy="64" r={r} fill="none" stroke="#edeef1" strokeWidth="16" />
      {segments.map((s, i) => {
        const len = (Math.max(0, s.pct) / 100) * c;
        if (len < 0.1) return null;
        const dash = `${len.toFixed(2)} ${(c - len).toFixed(2)}`;
        const offset = (-cum).toFixed(2);
        cum += len;
        return (
          <circle
            key={i}
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="16"
            strokeDasharray={dash}
            strokeDashoffset={offset}
          />
        );
      })}
    </svg>
  );
}
