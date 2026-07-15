// a compact tx-per-day bar chart, server-rendered as an SVG. one bar per indexed
// day-bucket, normalised to the busiest day. it renders whatever days exist: the
// window may span only a day or two, and a single indexed day must show a single
// bar rather than a blank line (the old polyline drew nothing for < 2 points).

export function Sparkline({
  values,
  height = 84,
  id = "spark",
}: {
  values: number[];
  height?: number;
  id?: string;
}) {
  void id;
  const w = 320;
  const h = height;
  const pad = 4;

  if (values.length === 0) {
    // genuinely no indexed days yet: a faint baseline, not a fake trend.
    return (
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block" }}
      >
        <line x1="0" y1={h - 2} x2={w} y2={h - 2} stroke="var(--border-hair, #e6e8ec)" strokeWidth="2" />
      </svg>
    );
  }

  const max = Math.max(1, ...values);
  const n = values.length;
  const gap = n > 1 ? 4 : 0;
  // cap the bar width so a 1- or 2-day window shows tidy centred bars instead of
  // one giant block; many days fill the width evenly.
  const barW = Math.min(40, (w - gap * (n - 1)) / n);
  const totalW = n * barW + (n - 1) * gap;
  const startX = Math.max(0, (w - totalW) / 2);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}
      role="img"
      aria-label={`transactions per day across ${n} indexed day${n === 1 ? "" : "s"}`}
    >
      {values.map((v, i) => {
        // a day with any activity always shows a visible bar; a zero day a sliver.
        const bh = v > 0 ? Math.max(3, (v / max) * (h - pad)) : 1;
        const x = startX + i * (barW + gap);
        const y = h - bh;
        return (
          <rect
            key={i}
            x={x.toFixed(1)}
            y={y.toFixed(1)}
            width={barW.toFixed(1)}
            height={bh.toFixed(1)}
            rx="1.5"
            fill="var(--green)"
          >
            <title>{`day ${i + 1} of ${n}: ${v.toLocaleString("en-US")} txns`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
