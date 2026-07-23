"use client";

// tiny inline-SVG sparkline for single-series micro trends (no axes by design)
export function Sparkline({
  data,
  width = 120,
  height = 32,
  stroke = "#14f195",
  fill = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: boolean;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const areaPath = `M${pts[0]} L${pts.slice(1).join(" L")} L${width - pad},${height} L${pad},${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {fill ? <path d={areaPath} fill={stroke} opacity="0.08" /> : null}
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={pts[pts.length - 1].split(",")[0]}
        cy={pts[pts.length - 1].split(",")[1]}
        r="2"
        fill={stroke}
      />
    </svg>
  );
}
