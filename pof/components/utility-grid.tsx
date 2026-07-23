"use client";

import {
  Gauge,
  GitBranch,
  LayoutDashboard,
  PlugZap,
  RefreshCw,
  Rocket,
  Users,
  Vault,
  type LucideIcon,
} from "lucide-react";
import { FEATURES } from "@/data/mock-data";
import { Panel } from "@/components/ui";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  RefreshCw,
  Vault,
  GitBranch,
  Gauge,
  Rocket,
  Users,
  PlugZap,
};

export function UtilityGrid() {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((f) => {
        const Icon = ICONS[f.icon] ?? Gauge;
        return (
          <Panel
            key={f.title}
            className="group px-4 py-3.5 transition-colors hover:border-accent/30"
          >
            <Icon
              size={15}
              className="text-muted transition-colors group-hover:text-accent"
            />
            <h3 className="mt-2.5 text-xs font-semibold text-text">{f.title}</h3>
            <p className="mt-1 text-2xs leading-4 text-muted">{f.text}</p>
          </Panel>
        );
      })}
    </div>
  );
}
