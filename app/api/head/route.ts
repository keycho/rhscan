// uncached head snapshot for the home page pollers. everything else on the home
// page is served from the short route-revalidation cache; this endpoint is the
// only always-fresh read, matching "head-adjacent data gets short revalidation".

import { latestBlocks, latestTransactions } from "@/src/web/lists";

export const dynamic = "force-dynamic";

export async function GET() {
  // degrade to empty rather than 500 on a transient pooler error; the poller
  // keeps its last good data and retries on the next tick.
  const [blocks, txns] = await Promise.all([
    latestBlocks(12).catch(() => []),
    latestTransactions(12).catch(() => []),
  ]);
  return Response.json(
    { blocks, txns },
    { headers: { "cache-control": "no-store, max-age=0" } },
  );
}
