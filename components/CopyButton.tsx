"use client";

// a tiny copy-to-clipboard affordance for full hashes and addresses on detail
// pages. purely an enhancement: the value is already visible and linkable. shows
// the design's overlapping-squares copy glyph, swapping to a check on success.

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
      aria-label={copied ? "copied" : "copy"}
      title={copied ? "copied" : "copy"}
      className="ml-1 inline-flex flex-none items-center justify-center align-middle text-muted transition-colors hover:text-green"
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      )}
    </button>
  );
}
