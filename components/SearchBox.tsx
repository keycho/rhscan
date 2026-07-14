// search input. a plain GET form to /search, so it works with no client
// javascript and the query lands as ?q=. the search page does the dispatch.

export function SearchBox({ big = false }: { big?: boolean }) {
  return (
    <form action="/search" method="get" className="w-full" role="search">
      <div className="relative">
        <input
          type="text"
          name="q"
          autoComplete="off"
          spellCheck={false}
          placeholder="search by address, tx hash, block, or token name / symbol"
          aria-label="search"
          className={`w-full rounded border border-border bg-panel px-3 text-text placeholder:text-faint outline-none focus:border-accent ${
            big ? "h-11 text-sm" : "h-9 text-[13px]"
          } mono`}
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded border border-border bg-panel2 px-2.5 py-1 text-2xs text-muted hover:border-accent hover:text-accent"
        >
          search
        </button>
      </div>
    </form>
  );
}
