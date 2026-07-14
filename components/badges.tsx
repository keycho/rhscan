// status / method / provenance pills, all server rendered.

import { Pill } from "@/components/primitives";
import { methodLabel, methodSignature } from "@/src/web/methods";

export function StatusBadge({ status }: { status: number | null }) {
  if (status == null) return <Pill tone="neutral">unknown</Pill>;
  return status === 1 ? <Pill tone="ok">success</Pill> : <Pill tone="bad">failed</Pill>;
}

export function MethodBadge({ methodId }: { methodId: string | null }) {
  const sig = methodSignature(methodId);
  return (
    <Pill tone="neutral" title={sig ?? methodId ?? "native transfer"}>
      <span className="mono">{methodLabel(methodId)}</span>
    </Pill>
  );
}

export function TokenTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  return <Pill tone="accent">{type}</Pill>;
}

// data served from the live cold-path fallback rather than the index. subtle, per
// the brief: a small provenance note, not an alarm.
export function SourceBadge({ source }: { source: "indexed" | "rpc" }) {
  if (source !== "rpc") return null;
  return (
    <Pill tone="warn" title="resolved live from rpc, below the indexed window, and cached">
      served live
    </Pill>
  );
}

export function FinalityBadge({ final }: { final: boolean }) {
  return final ? (
    <Pill tone="ok">final</Pill>
  ) : (
    <Pill tone="warn" title="within reorg depth of the head, may still change">
      unconfirmed
    </Pill>
  );
}
