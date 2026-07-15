// the honesty surfaces. two non-negotiables from the brief live here:
//   1. windowed history: disclose the indexed range plainly, and say when a page
//      came from the live fallback rather than pretend it is complete.
//   2. balances that may be wrong: when replayed holder balances disagree with
//      live balanceOf, flag the token rather than show a quietly wrong list.
// facts only, no scores.

import { formatNumber } from "@/src/web/format";
import type { DriftReport } from "@/src/web/drift";

function Banner({
  tone,
  children,
}: {
  tone: "info" | "warn" | "ok";
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-border bg-panel2 text-muted",
    warn: "border-warn/40 bg-warn/10 text-warn",
    ok: "border-ok/40 bg-ok/10 text-ok",
  } as const;
  return (
    <div className={`rounded border px-3 py-2 text-xs leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}

// the indexed range, stated plainly. shown small in the footer / stats area.
export function IndexedRangeNote({
  head,
  backfillFloor,
  windowFloor,
}: {
  head: number | null;
  backfillFloor: number | null;
  windowFloor: number | null;
}) {
  return (
    <p className="text-2xs leading-relaxed text-faint">
      the index holds a rolling recent window. indexed range{" "}
      <span className="mono text-muted">
        {windowFloor != null ? formatNumber(windowFloor) : "?"} –{" "}
        {head != null ? formatNumber(head) : "?"}
      </span>
      {backfillFloor != null && (
        <>
          , fully indexed from <span className="mono text-muted">{formatNumber(backfillFloor)}</span> up
        </>
      )}
      . older blocks resolve live through the cold-path resolver and are cached back.
    </p>
  );
}

// a page whose data came from the live rpc fallback (below the window).
export function LiveFallbackNote() {
  return (
    <Banner tone="warn">
      served live from rpc: this data is below the indexed window. it was resolved
      from the chain and cached, and is not part of the maintained index.
    </Banner>
  );
}

// address history truncation. an address's full history predates the window and
// cannot be rebuilt from rpc, so the list only covers indexed blocks.
export function AddressTruncationNote({ windowFloor }: { windowFloor: number | null }) {
  return (
    <Banner tone="info">
      history below the window is not shown. this list covers the indexed range
      {windowFloor != null ? (
        <>
          {" "}
          (from block <span className="mono">{formatNumber(windowFloor)}</span>)
        </>
      ) : null}{" "}
      only; earlier transactions for this address are not indexed. balance and
      nonce above are live chain state and reflect all history.
    </Banner>
  );
}

// holders balance-drift disclosure. flagged when the replay disagrees with live
// balanceOf; "could not verify" when the chain state was unreadable.
export function DriftBanner({ report }: { report: DriftReport }) {
  if (report.flagged) {
    return (
      <Banner tone="info">
        these balances are replayed from Transfer events and verified against the
        token&apos;s live balanceOf
        {report.atBlock != null ? (
          <>
            {" "}
            at block <span className="mono">{formatNumber(report.atBlock)}</span>
          </>
        ) : null}
        .{" "}
        <strong>
          {report.mismatches} of {report.checked}
        </strong>{" "}
        checked holders differ — this usually means fee-on-transfer, rebasing, or
        blacklist behaviour. the divergent rows are marked below.
      </Banner>
    );
  }
  if (!report.verifiable) {
    return (
      <Banner tone="info">
        could not verify these balances against live balanceOf (the chain state at
        the hydrated block was not readable). the list is replayed from Transfer
        events and is shown as-is.
      </Banner>
    );
  }
  return (
    <Banner tone="ok">
      checked: the top {report.checked} balances match the token&apos;s live
      balanceOf
      {report.atBlock != null ? (
        <>
          {" "}
          at block <span className="mono">{formatNumber(report.atBlock)}</span>
        </>
      ) : null}
      .
    </Banner>
  );
}

// generic small note.
export function Note({ children }: { children: React.ReactNode }) {
  return <Banner tone="info">{children}</Banner>;
}
