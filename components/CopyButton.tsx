"use client";

// a tiny copy-to-clipboard affordance for full hashes and addresses on detail
// pages. purely an enhancement: the value is already visible and linkable.

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          // clipboard unavailable (insecure context); ignore.
        }
      }}
      aria-label="copy"
      title="copy"
      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded border border-border text-2xs text-muted hover:border-accent hover:text-accent"
    >
      {copied ? "ok" : "cp"}
    </button>
  );
}
