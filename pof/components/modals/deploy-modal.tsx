"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Rocket } from "lucide-react";
import { Modal } from "./modal";
import { usePof } from "@/lib/store";
import { ALLOCATION_MODES } from "@/data/mock-data";
import { KV, Pill, btn } from "@/components/ui";

const STEPS = [
  "validating engine config…",
  "allocating launch slot…",
  "writing engine manifest…",
  "publishing public dashboard…",
];

export function DeployModal() {
  const { closeModal, deployConfig, wallet, completeDeploy } = usePof();
  const [phase, setPhase] = useState<"review" | "deploying" | "done">("review");
  const [step, setStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!deployConfig) return null;
  const alloc = ALLOCATION_MODES[deployConfig.mode];
  const weights = alloc.map((a) => a.pct).join(" / ");

  const simulate = () => {
    setPhase("deploying");
    STEPS.forEach((_, i) => {
      timers.current.push(setTimeout(() => setStep(i + 1), 550 * (i + 1)));
    });
    timers.current.push(
      setTimeout(() => {
        completeDeploy(deployConfig);
        setPhase("done");
      }, 550 * STEPS.length + 500)
    );
  };

  return (
    <Modal
      title={phase === "done" ? "Deployment complete" : "Preview engine deployment"}
      subtitle={phase === "done" ? undefined : "review the manifest before simulating deployment"}
      onClose={closeModal}
      wide
    >
      {phase === "done" ? (
        <div className="py-4 text-center">
          <CheckCircle2 size={36} className="mx-auto text-accent" />
          <h4 className="mt-3 font-mono text-sm font-semibold uppercase tracking-[0.12em] text-text">
            Engine deployed in demo mode
          </h4>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-muted">
            your draft engine was added to My Engines. in production this would publish a live
            public flywheel dashboard at{" "}
            <span className="font-mono text-accent">pof.fun/e/{deployConfig.slug || "new-engine"}</span>
          </p>
          <button onClick={closeModal} className={`${btn.primary} mt-5`}>
            Done
          </button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-line rounded border border-line bg-panel2 px-3 py-1">
            <KV
              label="token address"
              value={
                <span className="max-w-[220px] truncate text-secondary">
                  {deployConfig.tokenAddress || "So1…demo (placeholder)"}
                </span>
              }
            />
            <KV label="engine mode" value={deployConfig.mode} />
            <KV label="allocation weights" value={`${weights} %`} />
            <KV
              label="public page slug"
              value={<span className="text-accent">pof.fun/e/{deployConfig.slug || "new-engine"}</span>}
            />
            <KV label="cycle trigger" value={deployConfig.trigger} />
            <KV label="estimated setup cost" value="0.42 SOL (simulated)" />
            <KV label="network" value="Solana · mainnet-beta" />
            <KV label="wallet" value={wallet?.address ?? "—"} />
          </div>

          {phase === "deploying" ? (
            <div className="mt-4 space-y-1.5 rounded border border-line bg-bg px-3 py-3 font-mono text-2xs">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  {step > i ? (
                    <CheckCircle2 size={12} className="text-accent" />
                  ) : step === i ? (
                    <Loader2 size={12} className="animate-spin text-amber" />
                  ) : (
                    <span className="inline-block h-3 w-3 rounded-full border border-line" />
                  )}
                  <span className={step >= i ? "text-secondary" : "text-faint"}>{s}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            <Pill tone="amber">nothing is executed on-chain</Pill>
            <button
              onClick={simulate}
              disabled={phase === "deploying"}
              className={btn.primary}
            >
              {phase === "deploying" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> deploying…
                </>
              ) : (
                <>
                  <Rocket size={14} /> Simulate Deployment
                </>
              )}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
