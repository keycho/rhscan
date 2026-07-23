"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, CheckCircle2, Circle, Loader2, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Modal } from "./modal";
import { usePof } from "@/lib/store";
import type { AllocationSlice, DraftToken, EngineMode, FlywheelDraft } from "@/types";
import { shortAddress } from "@/components/solana-provider";
import { useSolBalance } from "@/lib/use-sol-balance";
import { loadDraft, saveDraft } from "@/lib/drafts";
import { fmt } from "@/lib/format";
import { btn, cx } from "@/components/ui";
import { RoutingEditor, TxPreview, slicesForMode, totalPct } from "@/components/routing-editor";

const STEPS = ["select token", "configure routing", "fund", "review", "create"];

const CREATE_STATES = [
  "preparing configuration",
  "creating flywheel",
  "routing policy saved",
  "flywheel preview created",
];

const DEMO_TOKEN: DraftToken = {
  name: "Demo Wheel",
  symbol: "$DEMO",
  mint: "demo-preview",
  demo: true,
};

const SLIPPAGE_OPTIONS = [0.5, 1, 2];

// full creation wizard. the wallet is real; the flywheel it produces is a
// saved configuration preview — no transaction is built, signed or submitted
// at any point, and the wallet balance is never touched.
export function ActivationModal() {
  const { closeModal, openModal, setPendingActivate, toast } = usePof();
  const { connected, publicKey } = useWallet();
  const balance = useSolBalance();
  const router = useRouter();

  const owner = publicKey?.toBase58() ?? "";

  // prefill from an existing draft unless "?fresh=1" asked for a clean run
  const initialDraft = useMemo(() => {
    if (typeof window === "undefined" || !owner) return null;
    if (new URLSearchParams(window.location.search).get("fresh") === "1") return null;
    return loadDraft(owner);
  }, [owner]);

  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [token, setToken] = useState<DraftToken | null>(initialDraft?.token ?? null);
  const [mode, setMode] = useState<EngineMode>(initialDraft?.mode ?? "Momentum");
  const [slices, setSlices] = useState<AllocationSlice[]>(() =>
    initialDraft ? initialDraft.weights.map((w) => ({ ...w })) : slicesForMode("Momentum")
  );
  const [amount, setAmount] = useState(
    initialDraft ? String(initialDraft.plannedDeposit) : ""
  );
  const [slippage, setSlippage] = useState(initialDraft?.slippagePct ?? 1);
  const [treasury, setTreasury] = useState(initialDraft?.treasury ?? "");
  const [creating, setCreating] = useState(-1); // -1 idle · 0..3 progress states
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const goTo = (i: number) => {
    if (i <= maxStep && creating < 0) setStep(i);
  };
  const advance = (i: number) => {
    setStep(i);
    setMaxStep((m) => Math.max(m, i));
  };

  const planned = parseFloat(amount);

  const validateFund = (): string | null => {
    if (!(planned > 0)) return "enter a planned deposit greater than zero";
    if (balance !== null && planned > balance)
      return `planned deposit exceeds wallet balance (${fmt(balance, 2)} SOL)`;
    const tooSmall = slices.find((s) => s.pct > 0 && (planned * s.pct) / 100 < 0.001);
    if (tooSmall)
      return `deposit too small — ${tooSmall.label.toLowerCase()} would receive under 0.001 SOL`;
    return null;
  };

  const create = () => {
    if (!publicKey || !token) return;
    setCreating(0);
    CREATE_STATES.forEach((_, i) => {
      if (i === 0) return;
      timers.current.push(setTimeout(() => setCreating(i), 750 * i));
    });
    timers.current.push(
      setTimeout(() => {
        const draft: FlywheelDraft = {
          owner: publicKey.toBase58(),
          token,
          mode,
          weights: slices.map(({ key, label, pct, color }) => ({ key, label, pct, color })),
          plannedDeposit: planned,
          slippagePct: slippage,
          treasury: treasury.trim() || publicKey.toBase58(),
          createdAt: Date.now(),
          status: "draft",
        };
        saveDraft(draft);
        toast("flywheel preview created");
        closeModal();
        router.push("/preview");
      }, 750 * CREATE_STATES.length + 400)
    );
  };

  // the wizard requires a genuine wallet connection
  if (!connected || !publicKey) {
    return (
      <Modal
        title="activate a flywheel"
        subtitle="connect your creator wallet to begin"
        onClose={closeModal}
      >
        <p className="text-xs leading-5 text-secondary">
          the creation flow starts from your real wallet — your address, network and SOL balance
          are read from the connected wallet. nothing is signed or submitted.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setPendingActivate(true);
              openModal("wallet");
            }}
            className={btn.solid}
          >
            <Wallet size={13} /> connect creator wallet
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="activate a flywheel" subtitle={undefined} onClose={closeModal} wide>
      {/* step indicator — completed steps are clickable */}
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {STEPS.map((s, i) => (
          <div key={s} className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => goTo(i)}
              disabled={i > maxStep || creating >= 0}
              className={cx(
                "flex h-5 w-5 items-center justify-center rounded-full border text-3xs transition",
                i < step
                  ? "border-accent bg-accent text-accent-ink"
                  : i === step
                    ? "border-accent text-accent"
                    : "border-line text-faint",
                i <= maxStep && i !== step && creating < 0 ? "hover:border-accent" : ""
              )}
            >
              {i < step ? <Check size={10} /> : i + 1}
            </button>
            <span
              className={cx(
                "hidden text-3xs lowercase md:block",
                i === step ? "text-accent" : "text-faint"
              )}
            >
              {s}
            </span>
            {i < STEPS.length - 1 ? <span className="h-px w-3 bg-line" /> : null}
          </div>
        ))}
      </div>

      {/* 01 select token */}
      {step === 0 ? (
        <div>
          <p className="text-xs text-secondary">
            tokens created by <span className="text-accent">{shortAddress(owner)}</span>:
          </p>
          <div className="mt-3 rounded border border-line bg-panel2 px-3.5 py-3 text-2xs leading-5 text-secondary">
            no creator token found for this wallet — Pump.fun creator lookup connects at protocol
            launch.
          </div>
          <button
            onClick={() => {
              setToken(DEMO_TOKEN);
              advance(1);
            }}
            className={cx(
              "mt-2 flex w-full items-center gap-3 rounded border px-3.5 py-3 text-left transition active:translate-y-px",
              token?.demo
                ? "border-accent bg-accent/10"
                : "border-line bg-panel2 hover:border-accent/60"
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded border border-line bg-bg text-2xs font-bold text-accent">
              DW
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-text">
                {DEMO_TOKEN.name} <span className="text-accent">{DEMO_TOKEN.symbol}</span>
              </span>
              <span className="block text-3xs text-faint">
                continue with demonstration token — not created by your wallet
              </span>
            </span>
            <span className="rounded-full border border-amber/40 px-2 py-0.5 text-3xs lowercase text-amber">
              demo token
            </span>
          </button>
        </div>
      ) : null}

      {/* 02 configure routing */}
      {step === 1 ? (
        <div>
          <p className="mb-3 text-xs text-secondary">
            choose how deposited SOL will be routed. weights must total exactly 100%.
          </p>
          <RoutingEditor slices={slices} onChange={setSlices} mode={mode} onMode={setMode} />
          <div className="mt-4 flex justify-between">
            <button onClick={() => goTo(0)} className={btn.outline}>
              back
            </button>
            <button
              onClick={() => {
                if (totalPct(slices) !== 100) {
                  toast("allocation must total exactly 100%", "info");
                  return;
                }
                advance(2);
              }}
              className={btn.solid}
            >
              continue
            </button>
          </div>
        </div>
      ) : null}

      {/* 03 fund */}
      {step === 2 ? (
        <div>
          <p className="mb-1.5 text-2xs lowercase text-muted">planned deposit</p>
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                inputMode="decimal"
                autoFocus
                className="h-9 w-full rounded-l border border-r-0 border-line bg-bg px-3 text-xs text-text placeholder:text-faint outline-none transition focus:border-accent"
              />
              <span className="flex h-9 items-center rounded-r border border-line bg-panel2 px-2.5 text-2xs text-muted">
                SOL
              </span>
            </div>
            <span className="text-3xs text-faint">
              wallet balance{" "}
              <span className="text-secondary">
                {balance !== null ? `${fmt(balance, 2)} SOL` : "unavailable"}
              </span>
            </span>
          </div>
          {planned > 0 ? (
            <div className="mt-3">
              <TxPreview slices={slices} amount={planned} />
            </div>
          ) : null}
          <p className="mt-2.5 text-3xs leading-4 text-faint">
            this is a planned amount for the preview — no transaction is requested and your wallet
            balance is not affected.
          </p>
          <div className="mt-4 flex justify-between">
            <button onClick={() => goTo(1)} className={btn.outline}>
              back
            </button>
            <button
              onClick={() => {
                const err = validateFund();
                if (err) {
                  toast(err, "info");
                  return;
                }
                advance(3);
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
          <div className="divide-y divide-line rounded border border-line bg-panel2 px-3 py-1 text-xs">
            <ReviewRow label="token" onEdit={() => goTo(0)}>
              {token?.name} <span className="text-accent">{token?.symbol}</span>{" "}
              {token?.demo ? (
                <span className="ml-1 rounded-full border border-amber/40 px-1.5 py-px text-3xs lowercase text-amber">
                  demo token
                </span>
              ) : null}
            </ReviewRow>
            <ReviewRow label="creator wallet">{shortAddress(owner)}</ReviewRow>
            <ReviewRow label="planned deposit" onEdit={() => goTo(2)}>
              {fmt(planned, 2)} SOL
            </ReviewRow>
            <ReviewRow label="allocation" onEdit={() => goTo(1)}>
              {mode.toLowerCase()} · {slices.map((s) => s.pct).join(" / ")} %
            </ReviewRow>
            <ReviewRow label="estimated network cost">~0.003 SOL</ReviewRow>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-2xs lowercase text-muted">estimated routing amounts</p>
            <TxPreview slices={slices} amount={planned} />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-2xs lowercase text-muted">slippage setting</p>
              <div className="flex gap-1.5">
                {SLIPPAGE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlippage(s)}
                    className={cx(
                      "rounded border px-2.5 py-1 text-2xs transition active:translate-y-px",
                      s === slippage
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line text-muted hover:border-line-strong hover:text-secondary"
                    )}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-2xs lowercase text-muted">treasury destination</p>
              <input
                value={treasury}
                onChange={(e) => setTreasury(e.target.value.trim())}
                placeholder={owner}
                spellCheck={false}
                className="h-8 w-full rounded border border-line bg-bg px-2.5 text-2xs text-text placeholder:text-faint outline-none transition focus:border-accent"
              />
              <p className="mt-1 text-3xs text-faint">defaults to the connected creator wallet</p>
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <button onClick={() => goTo(2)} className={btn.outline}>
              back
            </button>
            <button onClick={() => advance(4)} className={btn.solid}>
              continue
            </button>
          </div>
        </div>
      ) : null}

      {/* 05 create */}
      {step === 4 ? (
        <div>
          <p className="rounded border border-amber/40 bg-panel2 px-3 py-2.5 text-2xs leading-5 text-secondary">
            Demo preview only. Creating this flywheel will not submit a transaction or move SOL.
          </p>

          {creating >= 0 ? (
            <div className="mt-3 space-y-1.5 rounded border border-line bg-bg px-3 py-3 text-2xs">
              {CREATE_STATES.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  {creating > i ? (
                    <CheckCircle2 size={12} className="text-accent" />
                  ) : creating === i ? (
                    i === CREATE_STATES.length - 1 ? (
                      <CheckCircle2 size={12} className="text-accent" />
                    ) : (
                      <Loader2 size={12} className="animate-spin text-amber" />
                    )
                  ) : (
                    <Circle size={12} className="text-line-strong" />
                  )}
                  <span className={creating >= i ? "text-secondary" : "text-faint"}>{s}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="max-w-52 text-3xs leading-4 text-faint">
              returns are never guaranteed ·{" "}
              <Link href="/risks" className="underline underline-offset-2 hover:text-secondary">
                risk disclosure
              </Link>
            </p>
            <div className="flex gap-2">
              <button onClick={() => goTo(3)} disabled={creating >= 0} className={btn.outline}>
                back
              </button>
              <button onClick={create} disabled={creating >= 0} className={btn.solid}>
                {creating >= 0 ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> {CREATE_STATES[creating]}
                  </>
                ) : (
                  "create flywheel preview"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function ReviewRow({
  label,
  children,
  onEdit,
}: {
  label: string;
  children: ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-2xs lowercase text-muted">{label}</span>
      <span className="flex items-center gap-2 text-xs text-text">
        <span>{children}</span>
        {onEdit ? (
          <button
            onClick={onEdit}
            className="text-3xs lowercase text-faint underline underline-offset-2 transition hover:text-accent"
          >
            edit
          </button>
        ) : null}
      </span>
    </div>
  );
}
