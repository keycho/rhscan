// url-driven tabs. each tab is a link that sets ?tab=, so tab state is server
// rendered and shareable, with no client state.

import Link from "next/link";
import { formatNumber } from "@/src/web/format";

export interface TabDef {
  key: string;
  label: string;
  count?: number | null;
}

export function Tabs({
  tabs,
  active,
  basePath,
}: {
  tabs: TabDef[];
  active: string;
  basePath: string;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border">
      {tabs.map((t) => {
        const on = t.key === active;
        const href = t.key === tabs[0]!.key ? basePath : `${basePath}?tab=${t.key}`;
        return (
          <Link
            key={t.key}
            href={href}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] ${
              on
                ? "border-accent text-text"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            {t.label}
            {t.count != null && (
              <span className="ml-1.5 text-2xs text-faint">{formatNumber(t.count)}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
