import type { Metadata } from "next";
import { Panel } from "@/components/primitives";
import { SearchBox } from "@/components/SearchBox";
import { CollisionTable } from "@/components/CollisionTable";
import { topTokens, newTokenFeed } from "@/src/web/tokens-web";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "tokens",
  description: "most active and newly deployed tokens on robinhood chain.",
};

export default async function TokensPage() {
  const [top, fresh] = await Promise.all([topTokens(50), newTokenFeed(50)]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">tokens</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
          most tokens on this chain are memecoins and agent tokens, and
          impersonation is the norm: the same name and symbol recur across
          unrelated contracts. search a name or symbol below to see every contract
          that uses it, side by side, with deployment, deployer and concentration.
        </p>
        <div className="mt-3 max-w-2xl">
          <SearchBox />
        </div>
      </div>

      <Panel title="most active tokens" right={<span>by all-time transfer count</span>}>
        <CollisionTable tokens={top} />
      </Panel>

      <Panel title="newly deployed" right={<span>newest contract deployments</span>}>
        <CollisionTable tokens={fresh} />
      </Panel>
    </div>
  );
}
