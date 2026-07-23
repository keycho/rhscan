"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import { usePof } from "@/lib/store";
import { fmt } from "@/lib/format";

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-line bg-panel px-2.5 py-1.5 font-mono text-2xs shadow-lg">
      <p className="text-muted">epoch #{label}</p>
      <p className="mt-0.5 text-text">
        <span className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-accent" />
        {fmt(payload[0].value ?? 0, 2)} SOL fees
      </p>
    </div>
  );
}

// single-series area — fees routed per settled epoch (last 24)
export function FeesChart() {
  const { feesSeries } = usePof();
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={feesSeries} margin={{ top: 6, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="feesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14f195" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#14f195" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e2420" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="epoch"
            tick={{ fill: "#7d8c83", fontSize: 9, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={{ stroke: "#1e2420" }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tick={{ fill: "#7d8c83", fontSize: 9, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            width={28}
            domain={[0, 6]}
            ticks={[0, 2, 4, 6]}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "#2a332d", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="fees"
            stroke="#14f195"
            strokeWidth={2}
            fill="url(#feesFill)"
            isAnimationActive
            animationDuration={800}
            dot={false}
            activeDot={{ r: 3.5, fill: "#14f195", stroke: "#0d100e", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
