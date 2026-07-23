"use client";

import { CheckCircle2, Info, X } from "lucide-react";
import { usePof } from "@/lib/store";
import { cx } from "@/components/ui";

export function Toaster() {
  const { toasts, dismissToast } = usePof();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-72 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            "flex animate-toast-in items-start gap-2 rounded-md border bg-panel px-3 py-2.5 shadow-lg",
            t.tone === "success" ? "border-accent/40" : "border-line"
          )}
        >
          {t.tone === "success" ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-accent" />
          ) : (
            <Info size={14} className="mt-0.5 shrink-0 text-amber" />
          )}
          <p className="flex-1 font-mono text-2xs leading-4 text-secondary">{t.message}</p>
          <button
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss"
            className="text-faint transition-colors hover:text-text"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
