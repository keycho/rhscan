// the global footer: product line on the left, honesty note on the right.

import { AmberDot } from "@/components/honesty";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-footer">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-2 px-[22px] py-4 text-[11px] text-muted">
        <span>rhscan · community block explorer for robinhood chain</span>
        <span className="flex items-center gap-[7px]">
          <AmberDot />
          rolling window · not affiliated with robinhood
        </span>
      </div>
    </footer>
  );
}
