"use client";

import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";
import { fmt } from "@/lib/format";
import { Panel, cx } from "@/components/ui";

export function MetricCard({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  sub,
  subTone = "neutral",
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  sub?: string;
  subTone?: "green" | "amber" | "neutral";
  icon?: LucideIcon;
  accent?: boolean;
}) {
  const display = useCountUp(value);
  return (
    <Panel className="px-3.5 py-3 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between">
        <p className="font-mono text-3xs uppercase tracking-[0.14em] text-muted">{label}</p>
        {Icon ? <Icon size={13} className="text-faint" /> : null}
      </div>
      <p
        className={cx(
          "mt-1.5 font-mono text-xl font-bold tabular-nums",
          accent ? "text-accent" : "text-text"
        )}
      >
        {prefix}
        {fmt(display, decimals)}
        {suffix}
      </p>
      {sub ? (
        <p
          className={cx(
            "mt-0.5 font-mono text-3xs",
            subTone === "green" && "text-accent",
            subTone === "amber" && "text-amber",
            subTone === "neutral" && "text-muted"
          )}
        >
          {sub}
        </p>
      ) : null}
    </Panel>
  );
}

/** text-valued variant (health status, string metrics) */
export function TextMetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "green" | "amber" | "neutral";
}) {
  return (
    <Panel className="px-3.5 py-3 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between">
        <p className="font-mono text-3xs uppercase tracking-[0.14em] text-muted">{label}</p>
        {Icon ? <Icon size={13} className="text-faint" /> : null}
      </div>
      <p
        className={cx(
          "mt-1.5 font-mono text-xl font-bold",
          tone === "green" && "text-accent",
          tone === "amber" && "text-amber",
          tone === "neutral" && "text-text"
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 font-mono text-3xs text-muted">{sub}</p> : null}
    </Panel>
  );
}
