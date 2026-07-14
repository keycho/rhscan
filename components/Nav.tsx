"use client";

// the header band: bracket wordmark, primary nav with an active-pill, and — on
// every page except home — an inline search. on home the search lives in the
// masthead instead, so the header stays clean. server chrome (utility strip,
// footer) is rendered separately in the layout.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBox } from "@/components/SearchBox";

const LINKS: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: "/", label: "home", match: (p) => p === "/" },
  { href: "/blocks", label: "blockchain", match: (p) => p.startsWith("/blocks") || p.startsWith("/block/") || p.startsWith("/tx") || p.startsWith("/address") },
  { href: "/tokens", label: "tokens", match: (p) => p.startsWith("/tokens") || p.startsWith("/token/") },
];

export function Wordmark() {
  return (
    <Link
      href="/"
      className="mono flex flex-none items-center gap-[1px] text-[18px] font-semibold tracking-[-0.02em] no-underline hover:no-underline"
    >
      <span className="font-medium text-green">[</span>
      <span className="text-text">hoodscan</span>
      <span className="font-medium text-green">]</span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname() || "/";
  const isHome = pathname === "/";

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-[60px] max-w-page items-center gap-[22px] px-[22px]">
        <Wordmark />

        {!isHome && (
          <div className="hidden min-w-0 flex-1 sm:block">
            <SearchBox variant="header" />
          </div>
        )}

        <nav className={`flex items-center gap-[2px] text-[13.5px] font-medium ${isHome ? "ml-auto" : "flex-none"}`}>
          {LINKS.map((l) => {
            const on = l.match(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-[5px] px-[13px] py-[7px] no-underline transition-colors hover:no-underline ${
                  on
                    ? "bg-[rgba(12,143,79,0.10)] text-green"
                    : "text-secondary hover:bg-[#f0f1f3]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
