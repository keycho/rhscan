"use client";

import { Check, Lock, Plus, Settings2 } from "lucide-react";
import { usePof } from "@/lib/store";
import { LiveDot, Panel, PanelHeader, btn, cx } from "@/components/ui";

export function MyEngines() {
  const { user, wallet, engines, openModal, toast } = usePof();

  return (
    <div className="flex h-full flex-col gap-4">
      <Panel className="flex-1">
        <PanelHeader title="my engines" />
        {!user ? (
          <div className="flex flex-col items-center px-4 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel2 text-muted">
              <Lock size={15} />
            </span>
            <p className="mt-3 font-mono text-2xs text-secondary">sign in to manage engines</p>
            <p className="mt-1 max-w-[220px] font-mono text-3xs leading-4 text-faint">
              drafts, launch slots and deployment previews live here
            </p>
            <button onClick={() => openModal("signin")} className={`${btn.outline} mt-4`}>
              Sign In
            </button>
          </div>
        ) : (
          <div className="p-2.5">
            <div className="space-y-1.5">
              {engines.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-2.5 rounded border border-line bg-panel2/60 px-3 py-2.5 transition-colors hover:border-line-strong"
                >
                  {e.status === "live" ? (
                    <LiveDot />
                  ) : (
                    <span
                      className={cx(
                        "h-1.5 w-1.5 rounded-full",
                        e.status === "deployed" ? "bg-accent/60" : "bg-amber"
                      )}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs font-semibold text-text">{e.name}</p>
                    <p
                      className={cx(
                        "truncate font-mono text-3xs",
                        e.status === "live"
                          ? "text-accent"
                          : e.status === "deployed"
                            ? "text-secondary"
                            : "text-amber"
                      )}
                    >
                      {e.statusLabel} · {e.mode.toLowerCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => toast(`engine settings for "${e.slug}" — demo only`, "info")}
                    aria-label={`Settings for ${e.name}`}
                    className="text-faint transition-colors hover:text-secondary"
                  >
                    <Settings2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                document.querySelector("#launch-panel")?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-line px-3 py-2.5 font-mono text-2xs text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Plus size={13} /> Create New Engine
            </button>
          </div>
        )}
      </Panel>

      {/* access levels */}
      <Panel>
        <PanelHeader title="access levels" />
        <div className="space-y-2.5 px-4 py-3">
          {[
            {
              level: "public visitor",
              perks: "view genesis engine · inspect cycles + stats",
              ok: true,
            },
            {
              level: "signed-in user",
              perks: "create drafts · save settings · view launch slots",
              ok: Boolean(user),
            },
            {
              level: "connected wallet",
              perks: "preview deployment · configure routing · simulate publish",
              ok: Boolean(wallet),
            },
          ].map((row) => (
            <div key={row.level} className="flex items-start gap-2.5">
              <span
                className={cx(
                  "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  row.ok ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-faint"
                )}
              >
                {row.ok ? <Check size={9} /> : <Lock size={8} />}
              </span>
              <div>
                <p
                  className={cx(
                    "font-mono text-2xs font-semibold",
                    row.ok ? "text-text" : "text-muted"
                  )}
                >
                  {row.level}
                </p>
                <p className="font-mono text-3xs leading-4 text-faint">{row.perks}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
