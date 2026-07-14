// search input. a plain GET form to /search, so it works with no client
// javascript and the query lands as ?q=. the search page does the dispatch.
// three looks, all the same form: the masthead hero bar (home + search/404
// pages), the compact inline header bar, and a plain default.

const MagnifierIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
);

export function SearchBox({
  big = false,
  variant,
}: {
  big?: boolean;
  variant?: "masthead" | "header";
}) {
  const kind = variant ?? (big ? "masthead" : "header");

  if (kind === "masthead") {
    return (
      <form action="/search" method="get" role="search" className="w-full">
        <div className="flex items-stretch overflow-hidden rounded-[7px] border border-[#1c5236] bg-surface">
          <span className="flex flex-none cursor-default select-none items-center gap-[7px] border-r border-border-footer px-[15px] text-[12.5px] font-medium text-tertiary">
            all <span className="text-[10px] text-muted">▾</span>
          </span>
          <input
            type="text"
            name="q"
            autoComplete="off"
            spellCheck={false}
            aria-label="search"
            placeholder="address / txn hash / block / token"
            className="mono min-w-0 flex-1 bg-transparent px-[15px] py-[13px] text-[12.5px] text-text outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            aria-label="search"
            className="flex flex-none items-center bg-green px-5 text-white transition-[filter] hover:brightness-[1.08]"
          >
            <MagnifierIcon size={16} />
          </button>
        </div>
      </form>
    );
  }

  // compact inline header search.
  return (
    <form action="/search" method="get" role="search" className="w-full">
      <div className="flex max-w-[560px] items-stretch overflow-hidden rounded-[7px] border border-border bg-surface">
        <input
          type="text"
          name="q"
          autoComplete="off"
          spellCheck={false}
          aria-label="search"
          placeholder="search address / txn hash / block / token"
          className="mono min-w-0 flex-1 bg-transparent px-[13px] py-[9px] text-[12px] text-text outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label="search"
          className="flex flex-none items-center bg-green px-[14px] text-white transition-[filter] hover:brightness-[1.08]"
        >
          <MagnifierIcon size={15} />
        </button>
      </div>
    </form>
  );
}
