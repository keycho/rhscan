"use client";

import { useState } from "react";
import { Loader2, Mail, MessageSquare, Wallet } from "lucide-react";
import { Modal } from "./modal";
import { usePof } from "@/lib/store";
import { cx } from "@/components/ui";

const PROVIDERS = [
  { id: "x", label: "Continue with X", icon: "x" as const },
  { id: "discord", label: "Continue with Discord", icon: "discord" as const },
  { id: "email", label: "Continue with Email", icon: "email" as const },
  { id: "solana", label: "Connect Solana Wallet", icon: "wallet" as const },
];

function ProviderIcon({ icon }: { icon: (typeof PROVIDERS)[number]["icon"] }) {
  if (icon === "x")
    return (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  if (icon === "discord") return <MessageSquare size={15} />;
  if (icon === "email") return <Mail size={15} />;
  return <Wallet size={15} />;
}

export function SignInModal() {
  const { closeModal, signIn } = usePof();
  const [loading, setLoading] = useState<string | null>(null);

  const handle = (id: string) => {
    if (loading) return;
    setLoading(id);
    setTimeout(() => {
      setLoading(null);
      signIn(id);
    }, 900);
  };

  return (
    <Modal
      title="sign in to pof"
      subtitle="access engine drafts, launch slots and deployments"
      onClose={closeModal}
    >
      <div className="space-y-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => handle(p.id)}
            disabled={loading !== null}
            className={cx(
              "flex h-10 w-full items-center gap-3 rounded border border-line bg-panel2 px-3 text-xs font-medium text-secondary transition active:translate-y-px",
              loading === p.id
                ? "border-accent/60 text-accent"
                : "hover:border-accent/60 hover:text-text disabled:opacity-50"
            )}
          >
            <span className="text-muted">
              {loading === p.id ? (
                <Loader2 size={15} className="animate-spin text-accent" />
              ) : (
                <ProviderIcon icon={p.icon} />
              )}
            </span>
            {loading === p.id ? "authenticating…" : p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <p className="text-3xs leading-4 text-faint">
          By continuing, you agree to the{" "}
          <span className="cursor-pointer text-muted underline decoration-line underline-offset-2 hover:text-secondary">
            Terms
          </span>{" "}
          and{" "}
          <span className="cursor-pointer text-muted underline decoration-line underline-offset-2 hover:text-secondary">
            Privacy Policy
          </span>
          .
        </p>
      </div>
    </Modal>
  );
}
