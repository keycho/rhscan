"use client";

// raw transaction input with a decode toggle. there is no verified-source abi on
// this chain, so "decoded" means what we can show without one: the known function
// signature for the 4-byte selector (when we have it) and the calldata split into
// 32-byte words. honest about the limit: we never invent argument names.

import { useState } from "react";
import { methodSignature } from "@/src/web/methods";

function words(input: string): string[] {
  const hex = input.startsWith("0x") ? input.slice(2) : input;
  if (hex.length <= 8) return [];
  const body = hex.slice(8); // drop the 4-byte selector
  const out: string[] = [];
  for (let i = 0; i < body.length; i += 64) out.push(body.slice(i, i + 64));
  return out;
}

export function InputData({ input, methodId }: { input: string; methodId: string | null }) {
  const [decoded, setDecoded] = useState(false);
  const sig = methodSignature(methodId);
  const w = words(input);
  const empty = !input || input === "0x";

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className="flex rounded border border-border text-2xs">
          <button
            type="button"
            onClick={() => setDecoded(false)}
            className={`px-2 py-1 ${!decoded ? "bg-panel2 text-text" : "text-muted"}`}
          >
            hex
          </button>
          <button
            type="button"
            onClick={() => setDecoded(true)}
            className={`px-2 py-1 ${decoded ? "bg-panel2 text-text" : "text-muted"}`}
          >
            decoded
          </button>
        </div>
        {methodId && (
          <span className="mono text-2xs text-faint" title="4-byte selector">
            {methodId}
          </span>
        )}
      </div>

      {empty ? (
        <div className="text-xs text-faint">no input data (native value transfer).</div>
      ) : !decoded ? (
        <pre className="scroll-x mono max-h-64 overflow-auto whitespace-pre-wrap break-all rounded border border-border bg-panel2 p-3 text-2xs text-muted">
          {input}
        </pre>
      ) : (
        <div className="rounded border border-border bg-panel2 p-3 text-2xs">
          <div className="mb-2">
            <span className="text-faint">function </span>
            <span className="mono text-text">{sig ?? "unknown selector"}</span>
          </div>
          {w.length === 0 ? (
            <div className="text-faint">no argument words.</div>
          ) : (
            <ol className="space-y-1">
              {w.map((word, i) => (
                <li key={i} className="mono flex gap-2 text-muted">
                  <span className="w-6 shrink-0 text-right text-faint">{i}</span>
                  <span className="break-all">0x{word}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-2 text-faint">
            words are shown raw; without a verified abi, argument types and names
            are not inferred.
          </p>
        </div>
      )}
    </div>
  );
}
