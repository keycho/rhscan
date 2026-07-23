"use client";

import { useState, type ReactNode } from "react";
import { Lock, Rocket, Save } from "lucide-react";
import { usePof } from "@/lib/store";
import { ALLOCATION_MODES, CYCLE_TRIGGERS, MODE_NOTES } from "@/data/mock-data";
import type { EngineMode } from "@/types";
import { slugify } from "@/lib/format";
import { Panel, PanelHeader, Pill, btn, cx } from "@/components/ui";

const STEPS = [
  "paste token address",
  "choose flywheel mode",
  "set allocation weights",
  "launch public engine",
];

const MODES = Object.keys(ALLOCATION_MODES) as EngineMode[];

const inputCls =
  "h-9 w-full rounded border border-line bg-bg px-3 font-mono text-xs text-text placeholder:text-faint outline-none transition-colors focus:border-accent/60";

export function LaunchPanel() {
  const { user, wallet, gate, requestDeploy, toast } = usePof();
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<EngineMode>("Momentum");
  const [trigger, setTrigger] = useState(CYCLE_TRIGGERS[0]);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(name);
  const slices = ALLOCATION_MODES[mode];
  const ready = Boolean(user && wallet);

  // which onboarding step the visitor is on (visual only)
  const currentStep = !address ? 0 : !ready ? 2 : 3;

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
    <Panel id="launch-panel" className="flex h-full flex-col">
      <PanelHeader
        title="launch your flywheel"
        right={<Pill tone="amber">applications open</Pill>}
      />

      {/* steps */}
      <div className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3 sm:grid-cols-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cx(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-3xs",
                i <= currentStep
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-line text-faint"
              )}
            >
              {i + 1}
            </span>
            <span className="font-mono text-3xs uppercase tracking-wider text-muted">{s}</span>
          </div>
        ))}
      </div>

      <div className="grid flex-1 gap-4 px-4 py-4 md:grid-cols-2">
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
          <Field label="token name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Wheel"
              className={inputCls}
            />
          </Field>
          <Field label="engine mode">
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cx(
                    "rounded-full border px-2.5 py-1 font-mono text-3xs uppercase tracking-wider transition-colors",
                    m === mode
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-line text-muted hover:border-line-strong hover:text-secondary"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-1.5 font-mono text-3xs text-faint">{MODE_NOTES[mode]}</p>
          </Field>
          <Field label="cycle trigger">
            <div className="flex flex-wrap gap-1.5">
              {CYCLE_TRIGGERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTrigger(t)}
                  className={cx(
                    "rounded border px-2.5 py-1 font-mono text-3xs transition-colors",
                    t === trigger
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-line text-muted hover:border-line-strong hover:text-secondary"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="space-y-3">
          <Field label={`reserve split · ${mode.toLowerCase()}`}>
            <div className="rounded border border-line bg-bg p-3">
              <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                {slices.map((s) => (
                  <div
                    key={s.key}
                    className="transition-all duration-500"
                    style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                  />
                ))}
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1">
                {slices.map((s) => (
                  <div key={s.key} className="flex items-center gap-1.5 font-mono text-3xs">
                    <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                    <span className="text-muted">{s.label}</span>
                    <span className="ml-auto tabular-nums text-secondary">{s.pct}%</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 flex items-center gap-1 font-mono text-3xs text-faint">
                {wallet ? null : <Lock size={9} />}
                {wallet
                  ? "custom weight editing unlocked (demo)"
                  : "connect wallet to configure fee routing weights"}
              </p>
            </div>
          </Field>
          <Field label="public page slug">
            <div className="flex items-center gap-0">
              <span className="flex h-9 items-center rounded-l border border-r-0 border-line bg-panel2 px-2.5 font-mono text-xs text-faint">
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

          <div className="rounded border border-line bg-bg px-3 py-2.5 font-mono text-3xs leading-4 text-faint">
            {!user
              ? "> sign in to create an engine draft and save settings"
              : !wallet
                ? "> connected sign-in ok — connect a wallet to preview deployment"
                : "> wallet connected — engine config ready for deployment preview"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
        <button
          onClick={() => gate("user", () => toast("engine draft saved (local only)"))}
          className={btn.outline}
        >
          {user ? <Save size={13} /> : <Lock size={13} />} Save Draft
        </button>
        <button onClick={submit} className={btn.primary}>
          {ready ? (
            <>
              <Rocket size={14} /> Preview Engine Deployment
            </>
          ) : (
            <>
              <Lock size={13} /> Create Engine
            </>
          )}
        </button>
      </div>
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-3xs uppercase tracking-[0.14em] text-muted">{label}</p>
      {children}
    </div>
  );
}
