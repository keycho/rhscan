// the global footer: product line on the left, socials on the right.

export function SiteFooter() {
  return (
    <footer className="border-t border-border-footer">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-2 px-[22px] py-4 text-[11px] text-muted">
        <span>hoodscan · community block explorer for robinhood chain</span>
        <a
          href="https://x.com/hoodscaninfo"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-[6px] text-muted hover:text-text"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-[13px] w-[13px] fill-current"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          @hoodscaninfo
        </a>
      </div>
    </footer>
  );
}
