"use client";

import { useState, type ReactNode } from "react";
import { Lock, Rocket } from "lucide-react";
import { Modal } from "./modal";
import { usePof } from "@/lib/store";
import { ALLOCATION_MODES, CYCLE_TRIGGERS, MODE_NOTES } from "@/data/mock-data";
import type { EngineMode } from "@/types";
import { slugify } from "@/lib/format";
import { btn, cx } from "@/components/ui";

const MODES = Object.keys(ALLOCATION_MODES) as EngineMode[];

const inputCls =
  "h-9 w-full rounded border border-line bg-bg px-3 text-xs text-text placeholder:text-faint outline-none transition focus:border-accent";

export function LaunchModal() {
  const { user, wallet, gate, requestDeploy, closeModal } = usePof();
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<EngineMode>("Momentum");
  const [trigger, setTrigger] = useState(CYCLE_TRIGGERS[0]);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(name);
  const slices = ALLOCATION_MODES[mode];
  const ready = Boolean(user && wallet);

  const submit = () =>
    gate("wallet", () =>
      requestDeploy({
        tokenAddress: address.trim(),
        tokenName: name.trim() || "Untitled Engine",
        mode,
        trigger,
        slug: effectiveSlug || "new-engine",
      })
    );

  return (
    <Modal
      title="launch a flywheel"
      subtitle="paste a token · pick a mode · claim a slot"
      onClose={closeModal}
      wide
    >
      <div className="space-y-3">
        <Field label="token address">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="paste your pump.fun token address"
            className={inputCls}
            spellCheck={false}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="token name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Wheel"
              className={inputCls}
            />
          </Field>
          <Field label="public page slug">
            <div className="flex items-center">
              <span className="flex h-9 items-center rounded-l border border-r-0 border-line bg-panel2 px-2 text-2xs text-faint">
                pof.fun/e/
              </span>
              <input
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="my-wheel"
                className={cx(inputCls, "rounded-l-none")}
                spellCheck={false}
              />
            </div>
          </Field>
        </div>
        <Field label="engine mode">
          <div className="flex flex-wrap gap-1.5">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cx(
                  "rounded border px-2.5 py-1 text-2xs lowercase transition active:translate-y-px",
                  m === mode
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line text-muted hover:border-line-strong hover:text-secondary"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-3xs text-faint">{MODE_NOTES[mode]}</p>
        </Field>
        <Field label="cycle trigger">
          <div className="flex flex-wrap gap-1.5">
            {CYCLE_TRIGGERS.map((t) => (
              <button
                key={t}
                onClick={() => setTrigger(t)}
                className={cx(
                  "rounded border px-2.5 py-1 text-2xs transition active:translate-y-px",
                  t === trigger
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line text-muted hover:border-line-strong hover:text-secondary"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
        <Field label={`reserve split · ${mode.toLowerCase()}`}>
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-sm">
            {slices.map((s) => (
              <div
                key={s.key}
                className="transition-all duration-500"
                style={{ width: `${s.pct}%`, backgroundColor: s.color }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {slices.map((s) => (
              <span key={s.key} className="flex items-center gap-1 text-3xs text-muted">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                {s.label} {s.pct}%
              </span>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
        <p className="text-3xs text-faint">
          {!user
            ? "> sign in to configure your engine"
            : !wallet
              ? "> connect a wallet to deploy"
              : "> config ready — engine deploys to your slot"}
        </p>
        <button onClick={submit} className={btn.solid}>
          {ready ? (
            <>
              <Rocket size={13} /> review deployment
            </>
          ) : (
            <>
              <Lock size={12} /> create engine
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-2xs lowercase text-muted">{label}</p>
      {children}
    </div>
  );
}
