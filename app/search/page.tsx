import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Container, Panel, Empty } from "@/components/primitives";
import { SearchBox } from "@/components/SearchBox";
import { CollisionTable } from "@/components/CollisionTable";
import { resolveSearch } from "@/src/web/search-web";

// dispatch depends entirely on the query and may hit the cold-path resolver, so
// it is never statically cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!query) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-3 text-[20px] font-semibold tracking-[-0.02em]">search</h1>
          <SearchBox big />
          <p className="mt-3 text-xs text-label">
            enter an address, a transaction or block hash, a block number, or a token name or symbol.
          </p>
        </div>
      </Container>
    );
  }

  const result = await resolveSearch(query);

  if (result.kind === "redirect") {
    redirect(result.to);
  }

  if (result.kind === "collisions") {
    return (
      <Container className="space-y-4 py-6">
        <div className="mx-auto max-w-2xl">
          <SearchBox big />
        </div>
        <Panel
          title={`${result.tokens.length} tokens match "${result.term}"`}
          right={<span>name or symbol collision</span>}
        >
          <div className="border-b border-border-hair px-4 py-2 text-xs text-label">
            more than one contract uses this name or symbol. they are unrelated. compare deployer,
            age, holders and top-10 concentration to tell them apart.
          </div>
          <CollisionTable tokens={result.tokens} />
        </Panel>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-3 text-[20px] font-semibold tracking-[-0.02em]">no results</h1>
        <Panel>
          <Empty>
            nothing resolved for <span className="mono text-secondary">{result.query}</span>.
          </Empty>
        </Panel>
        <div className="mt-4">
          <SearchBox big />
        </div>
      </div>
    </Container>
  );
}
