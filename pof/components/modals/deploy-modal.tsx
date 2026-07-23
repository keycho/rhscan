"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Rocket } from "lucide-react";
import { Modal } from "./modal";
import { usePof } from "@/lib/store";
import { ALLOCATION_MODES } from "@/data/mock-data";
import { KV, btn } from "@/components/ui";

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

  const deploy = () => {
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
      title={phase === "done" ? "engine deployed" : "review deployment"}
      subtitle={phase === "done" ? undefined : "confirm the manifest before deploying"}
      onClose={closeModal}
      wide
    >
      {phase === "done" ? (
        <div className="py-4 text-center">
          <CheckCircle2 size={36} className="mx-auto text-accent" />
          <h4 className="mt-3 text-sm font-bold lowercase text-text">your flywheel is turning</h4>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-muted">
            engine added to my engines. your public dashboard is provisioning at{" "}
            <span className="text-accent">pof.fun/e/{deployConfig.slug || "new-engine"}</span>
          </p>
          <button onClick={closeModal} className={`${btn.solid} mt-5`}>
            done
          </button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-line rounded border border-line bg-panel2 px-3 py-1">
            <KV
              label="token address"
              value={
                <span className="max-w-[220px] truncate text-secondary">
                  {deployConfig.tokenAddress || "—"}
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
            <KV label="estimated setup cost" value="0.42 SOL" />
            <KV label="network" value="Solana · mainnet-beta" />
            <KV label="wallet" value={wallet?.address ?? "—"} />
          </div>

          {phase === "deploying" ? (
            <div className="mt-4 space-y-1.5 rounded border border-line bg-bg px-3 py-3 text-2xs">
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
            <p className="max-w-56 text-3xs leading-4 text-faint">
              token performance, liquidity and returns are never guaranteed ·{" "}
              <Link href="/risks" className="underline underline-offset-2 hover:text-secondary">
                risk disclosure
              </Link>
            </p>
            <button onClick={deploy} disabled={phase === "deploying"} className={btn.solid}>
              {phase === "deploying" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> deploying…
                </>
              ) : (
                <>
                  <Rocket size={14} /> deploy engine
                </>
              )}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
