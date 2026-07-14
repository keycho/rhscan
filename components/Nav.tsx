// top navigation: wordmark, primary links, and a compact search that is present
// on every page. server rendered.

import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-page flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-baseline gap-1.5 text-text hover:text-text">
          <span className="text-base font-bold tracking-tight">rhscan</span>
          <span className="text-2xs text-faint">robinhood chain</span>
        </Link>
        <nav className="flex items-center gap-4 text-[13px]">
          <Link href="/" className="text-muted hover:text-text">
            home
          </Link>
          <Link href="/tokens" className="text-muted hover:text-text">
            tokens
          </Link>
        </nav>
        <div className="ml-auto w-full min-w-[220px] max-w-[440px] flex-1 sm:w-auto">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
