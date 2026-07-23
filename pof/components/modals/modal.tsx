"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cx } from "@/components/ui";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cx(
          "w-full animate-modal-in rounded-md border border-line bg-panel shadow-[0_0_60px_rgba(20,241,149,0.06)]",
          wide ? "max-w-lg" : "max-w-md"
        )}
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <h3 className="font-mono text-sm font-semibold uppercase tracking-[0.12em] text-text">
              {title}
            </h3>
            {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-muted transition-colors hover:bg-panel2 hover:text-text"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
