// prev / next navigation for sequential pages (blocks). a disabled end renders as
// inert text so the control never dead-links.

import Link from "next/link";

function Cell({ href, children }: { href: string | null; children: React.ReactNode }) {
  const cls =
    "rounded border px-2.5 py-1 text-xs " +
    (href
      ? "border-border bg-panel2 text-muted hover:border-accent hover:text-accent"
      : "border-border/50 text-faint");
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <span className={cls}>{children}</span>
  );
}

export function PrevNext({ prev, next }: { prev: string | null; next: string | null }) {
  return (
    <div className="flex items-center gap-1">
      <Cell href={prev}>{"< prev"}</Cell>
      <Cell href={next}>{"next >"}</Cell>
    </div>
  );
}
