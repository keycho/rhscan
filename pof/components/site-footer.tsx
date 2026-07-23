"use client";

import { usePof } from "@/lib/store";
import { PofMark } from "@/components/ui";

const DOC_LINKS = [
  "engine setup guide",
  "allocation modes",
  "launch requirements",
  "dashboard modules",
  "public page examples",
];

export function SiteFooter() {
  const { toast } = usePof();
  return (
    <footer id="docs" className="scroll-mt-20 border-t border-line bg-panel">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-8 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <PofMark size={18} />
            <span className="text-sm font-bold lowercase text-text">
              proof of flywheel<span className="text-accent">_</span>
            </span>
          </div>
          <p className="mt-2 text-2xs text-accent">every trade turns the wheel</p>
          <p className="mt-1 max-w-[280px] text-2xs leading-4 text-muted">
            a public flywheel layer for launch tokens. fees in. liquidity grows. supply burns.
            holders earn.
          </p>
        </div>
        <div>
          <p className="text-3xs uppercase tracking-wide text-faint">docs</p>
          <ul className="mt-2.5 space-y-1.5">
            {DOC_LINKS.map((l) => (
              <li key={l}>
                <button
                  onClick={() => toast(`${l} — publishing at launch`, "info")}
                  className="text-2xs text-muted transition hover:text-accent"
                >
                  [ {l} ]
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-3xs uppercase tracking-wide text-faint">community</p>
          <ul className="mt-2.5 space-y-1.5">
            {["x / twitter", "telegram", "engine updates"].map((l) => (
              <li key={l}>
                <button
                  onClick={() => toast(`${l} — dropping at launch`, "info")}
                  className="text-2xs text-muted transition hover:text-accent"
                >
                  [ {l} ]
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-2 px-4 py-3 text-3xs text-faint">
          <p>© 2026 proof of flywheel · every trade turns the wheel</p>
          <p>reserve balances publish on-chain at launch</p>
        </div>
      </div>
    </footer>
  );
}
