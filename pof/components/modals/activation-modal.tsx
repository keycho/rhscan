"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Lock, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Modal } from "./modal";
import { usePof } from "@/lib/store";
import type { AllocationSlice, EngineMode } from "@/types";
import { shortAddress } from "@/components/solana-provider";
import { btn, cx } from "@/components/ui";
import { RoutingEditor, TxPreview, slicesForMode, totalPct } from "@/components/routing-editor";

const STEPS = ["connect", "verify", "configure", "review", "fund"];

// activation preview: the wallet connection is real; creator verification and
// deposits are NOT live yet, and every unavailable step says so explicitly.
export function ActivationModal() {
  const { closeModal, openModal, toast } = usePof();
  const { connected, publicKey } = useWallet();
  const [step, setStep] = useState(connected ? 1 : 0);
  const [mode, setMode] = useState<EngineMode>("Momentum");
  const [slices, setSlices] = useState<AllocationSlice[]>(() => slicesForMode("Momentum"));
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Modal
      title="activate a flywheel"
      subtitle="connect creator wallet → verify token → configure routing → deposit SOL → execute cycle"
      onClose={closeModal}
      wide
    >
      {/* step indicator */}
      <div className="mb-4 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className={cx(
                "flex h-5 w-5 items-center justify-center rounded-full border text-3xs",
                i < step
                  ? "border-accent bg-accent text-accent-ink"
                  : i === step
                    ? "border-accent text-accent"
                    : "border-line text-faint"
              )}
            >
              {i < step ? <Check size={10} /> : i + 1}
            </span>
            <span
              className={cx(
                "hidden text-3xs lowercase sm:block",
                i === step ? "text-accent" : "text-faint"
              )}
            >
              {s}
            </span>
            {i < STEPS.length - 1 ? <span className="h-px w-3 bg-line" /> : null}
          </div>
        ))}
        <span className="ml-auto rounded-full border border-amber/40 px-2 py-0.5 text-3xs lowercase text-amber">
          technical preview
        </span>
      </div>

      {/* 01 connect — real wallet connection */}
      {step === 0 ? (
        <div>
          <p className="text-xs leading-5 text-secondary">
            connect the Solana wallet that created your Pump.fun token. only the verified creator
            wallet will be able to activate a flywheel, change its routing, set treasury addresses
            or pause it.
          </p>
          {connected && publicKey ? (
            <div className="mt-3 rounded border border-accent/40 bg-panel2 px-3 py-2.5 text-2xs text-secondary">
              connected · <span className="text-accent">{shortAddress(publicKey.toBase58())}</span>
            </div>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            {connected ? (
              <button onClick={() => setStep(1)} className={btn.solid}>
                continue
              </button>
            ) : (
              <button onClick={() => openModal("wallet")} className={btn.solid}>
                <Wallet size={13} /> connect creator wallet
              </button>
            )}
          </div>
          <p className="mt-3 text-3xs text-faint">
            pof never requests seed phrases or private keys.
          </p>
        </div>
      ) : null}

      {/* 02 verify — no fictional tokens: verification is not live yet */}
      {step === 1 ? (
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-secondary">
              creator-token detection for{" "}
              <span className="text-accent">
                {publicKey ? shortAddress(publicKey.toBase58()) : "your wallet"}
              </span>
              :
            </p>
            <span className="flex items-center gap-1 rounded-full border border-amber/40 px-2 py-0.5 text-3xs lowercase text-amber">
              <AlertTriangle size={10} /> verification unavailable
            </span>
          </div>
          <div className="mt-3 rounded border border-line bg-panel2 px-3.5 py-3 text-2xs leading-5 text-secondary">
            creator verification queries Pump.fun token data for the connected public key when the
            protocol goes live. this technical preview does not verify tokens, and no token is
            shown as eligible for your wallet.
          </div>
          <p className="mt-2.5 text-3xs leading-4 text-faint">
            at launch, tokens are classified as: eligible · creator verification required · pool
            not supported · not created by connected wallet. liquidity routing requires a
            graduated Pump.fun token with a canonical PumpSwap pool.
          </p>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(0)} className={btn.outline}>
              back
            </button>
            <button onClick={() => setStep(2)} className={btn.solid}>
              preview configuration
            </button>
          </div>
        </div>
      ) : null}

      {/* 03 configure — local preview, fully functional */}
      {step === 2 ? (
        <div>
          <p className="mb-3 text-xs text-secondary">
            choose how deposited SOL will be routed. weights must total exactly 100%.
          </p>
          <RoutingEditor slices={slices} onChange={setSlices} mode={mode} onMode={setMode} />
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(1)} className={btn.outline}>
              back
            </button>
            <button
              onClick={() => {
                if (totalPct(slices) !== 100) {
                  toast("allocation must total exactly 100%", "info");
                  return;
                }
                setStep(3);
              }}
              className={btn.solid}
            >
              continue
            </button>
          </div>
        </div>
      ) : null}

      {/* 04 review */}
      {step === 3 ? (
        <div>
          <p className="mb-2 text-xs text-secondary">routing preview per 1 SOL cycle:</p>
          <TxPreview slices={slices} amount={1} />
          <div className="mt-2.5 space-y-1 text-3xs text-faint">
            <p>
              protocol fee: <span className="text-secondary">announced at launch</span>
            </p>
            <p>
              treasury / growth destinations:{" "}
              <span className="text-secondary">set by the verified creator before activation</span>
            </p>
          </div>
          <button
            onClick={() => setConfirmed((v) => !v)}
            className="mt-3 flex w-full items-start gap-2 border-t border-line pt-3 text-left"
          >
            <span
              className={cx(
                "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition",
                confirmed ? "border-accent bg-accent text-accent-ink" : "border-line-strong"
              )}
              role="checkbox"
              aria-checked={confirmed}
            >
              {confirmed ? <Check size={11} /> : null}
            </span>
            <span className="text-3xs leading-4 text-muted">
              I control or am authorised to use this creator wallet, have reviewed the routing
              destinations, and accept the{" "}
              <Link href="/terms" className="text-secondary underline underline-offset-2 hover:text-accent">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/risks" className="text-secondary underline underline-offset-2 hover:text-accent">
                Risk Disclosure
              </Link>
              .
            </span>
          </button>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(2)} className={btn.outline}>
              back
            </button>
            <button
              onClick={() => {
                if (!confirmed) {
                  toast("confirm creator wallet authorisation first", "info");
                  return;
                }
                setStep(4);
              }}
              className={btn.solid}
            >
              continue
            </button>
          </div>
        </div>
      ) : null}

      {/* 05 fund — contract execution is not available in the preview */}
      {step === 4 ? (
        <div>
          <p className="mb-2 text-xs text-secondary">
            deposit SOL to fund the flywheel and execute the first routing cycle.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center opacity-50">
              <input
                disabled
                placeholder="amount"
                className="h-9 w-full rounded-l border border-r-0 border-line bg-bg px-3 text-xs text-text placeholder:text-faint outline-none"
              />
              <span className="flex h-9 items-center rounded-r border border-line bg-panel2 px-2.5 text-2xs text-muted">
                SOL
              </span>
            </div>
            <button disabled className={cx(btn.solid, "opacity-60")}>
              <Lock size={12} /> deposit SOL &amp; activate flywheel
            </button>
          </div>
          <div className="mt-3 rounded border border-amber/40 bg-panel2 px-3 py-2.5 text-2xs leading-5 text-secondary">
            deposits open when the protocol contracts go live. no transaction is created in this
            preview, and nothing is signed or executed.
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="max-w-52 text-3xs leading-4 text-faint">
              returns are never guaranteed ·{" "}
              <Link href="/risks" className="underline underline-offset-2 hover:text-secondary">
                risk disclosure
              </Link>
            </p>
            <button onClick={() => setStep(3)} className={btn.outline}>
              back
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
