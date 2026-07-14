// a small area sparkline, server-rendered as an SVG polyline + gradient fill.
// used for the 14-day tx-history trend on the home stats card. values are a plain
// number series; the polyline is normalised to the series range.

export function Sparkline({
  values,
  height = 84,
  id = "spark",
}: {
  values: number[];
  height?: number;
  id?: string;
}) {
  const w = 320;
  const h = height;
  const padY = 10;

  if (values.length < 2) {
    // not enough indexed days to draw a trend line.
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
        <line x1="0" y1={h - padY} x2={w} y2={h - padY} stroke="#edeef1" strokeWidth="2" />
      </svg>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const n = values.length;
  const pts = values.map((v, i) => {
    const x = (i / (n - 1)) * w;
    const y = padY + (1 - (v - min) / range) * (h - padY * 2);
    return [x, y] as const;
  });

  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area =
    `M0,${h} ` +
    pts.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(" ") +
    ` L${w},${h} Z`;
  const gradId = `${id}-area`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--green)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <polyline points={line} fill="none" stroke="var(--green)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
