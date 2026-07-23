"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowDownToLine, Droplets, Flame, Users, Vault } from "lucide-react";
import { usePof } from "@/lib/store";
import { fmt } from "@/lib/format";
import { GENESIS } from "@/data/mock-data";
import { LiveDot, Panel, PanelHeader, Pill, cx } from "@/components/ui";

const ORBIT = 38; // % radius of the node ring

export function FlywheelGraphic() {
  const { speed, epoch, feesRouted } = usePof();
  const [active, setActive] = useState(0);

  // reserve-type nodes show routing config (split %), never fabricated balances
  const nodes = [
    { label: "fees in", value: `${fmt(feesRouted, 1)} SOL`, icon: ArrowDownToLine },
    { label: "reserve", value: "routing hub", icon: Vault },
    { label: "liquidity", value: "35% split", icon: Droplets },
    { label: "burn", value: "20% split", icon: Flame },
    { label: "community", value: "10% split", icon: Users },
    { label: "momentum", value: `score ${GENESIS.momentumScore}`, icon: Activity },
  ];

  // flow indicator — light one node after another, following the loop
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % 6), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="flywheel · engine_001"
        right={
          <Pill tone="green">
            <LiveDot /> turning
          </Pill>
        }
      />
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="relative aspect-square w-full max-w-[440px]">
          {/* rings + flow dots */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {/* rotating dashed outer ring */}
            <g className="origin-center animate-spin-slow">
              <circle
                cx="50"
                cy="50"
                r="47"
                fill="none"
                stroke="#1e2420"
                strokeWidth="0.35"
                strokeDasharray="1.2 2.4"
              />
            </g>
            {/* orbit track */}
            <circle cx="50" cy="50" r={ORBIT} fill="none" stroke="#1e2420" strokeWidth="0.5" />
            {/* soft center glow */}
            <circle cx="50" cy="50" r="20" fill="#14f195" opacity="0.045" />
            {/* flow dots travelling the loop */}
            {[0, -3, -6].map((begin) => (
              <g key={begin}>
                <circle r="1.3" fill="#14f195" style={{ filter: "drop-shadow(0 0 2.5px #14f195)" }}>
                  {/* negative begin offsets start each dot mid-orbit immediately,
                      so none idles at the svg origin waiting for its delay */}
                  <animateMotion
                    dur="9s"
                    begin={`${begin}s`}
                    repeatCount="indefinite"
                    path={`M 50 ${50 - ORBIT} a ${ORBIT} ${ORBIT} 0 1 1 0 ${ORBIT * 2} a ${ORBIT} ${ORBIT} 0 1 1 0 -${ORBIT * 2}`}
                  />
                </circle>
              </g>
            ))}
          </svg>

          {/* nodes */}
          {nodes.map((node, i) => {
            const angle = ((-90 + i * 60) * Math.PI) / 180;
            const x = 50 + ORBIT * Math.cos(angle);
            const y = 50 + ORBIT * Math.sin(angle);
            const isActive = active === i;
            return (
              <div
                key={node.label}
                className="absolute w-24 -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div
                  className={cx(
                    "mx-auto flex h-9 w-9 items-center justify-center rounded-full border bg-panel2 transition-all duration-300",
                    isActive
                      ? "border-accent text-accent shadow-[0_0_16px_rgba(20,241,149,0.35)]"
                      : "border-line text-muted"
                  )}
                >
                  <node.icon size={14} />
                </div>
                <p
                  className={cx(
                    "mt-1 font-mono text-3xs uppercase tracking-wider transition-colors duration-300",
                    isActive ? "text-accent" : "text-secondary"
                  )}
                >
                  {node.label}
                </p>
                <p className="font-mono text-3xs tabular-nums text-faint">{node.value}</p>
              </div>
            );
          })}

          {/* hub */}
          <div className="absolute left-1/2 top-1/2 flex h-[8.5rem] w-[8.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-line bg-panel shadow-[0_0_60px_rgba(20,241,149,0.10)]">
            <p className="font-mono text-3xs uppercase tracking-[0.16em] text-muted">speed</p>
            <p className="font-mono text-3xl font-bold tabular-nums text-accent">
              {fmt(speed, 0)}%
            </p>
            <div className="my-1 h-px w-14 bg-line" />
            <p className="font-mono text-2xs text-secondary">epoch #{epoch}</p>
            <p className="mt-0.5 flex items-center gap-1.5 font-mono text-3xs uppercase tracking-wider text-accent">
              <LiveDot /> turning
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-line px-4 py-2 text-center">
        <p className="font-mono text-3xs uppercase tracking-[0.12em] text-faint">
          fees in → reserve → liquidity → burn → community → momentum → fees in
        </p>
      </div>
    </Panel>
  );
}
