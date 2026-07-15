// eth price from coingecko, server-side, cached 60s. native gas on this chain is
// eth, so this is the only external price the explorer needs. a failure returns
// null and the ui simply omits usd, never blocks a render on it.

export async function getEthUsd(): Promise<number | null> {
  return (await getEthMarket()).usd;
}

export interface EthMarket {
  usd: number | null;
  change24h: number | null; // percent, e.g. 6.27
  marketCap: number | null; // usd
}

// eth price with 24h change and market cap, for the home stats card. same
// coingecko call, cached 60s; any failure degrades to nulls and the ui simply
// omits the missing figures rather than blocking a render.
export async function getEthMarket(): Promise<EthMarket> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true",
      {
        next: { revalidate: 60 },
        headers: { accept: "application/json" },
        // hard cap so a slow/hung coingecko can never stall the page. this call
        // runs in the layout on every route; without a timeout a hung fetch is a
        // 300s serverless timeout, not a graceful null.
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!res.ok) return { usd: null, change24h: null, marketCap: null };
    const json = (await res.json()) as {
      ethereum?: { usd?: number; usd_24h_change?: number; usd_market_cap?: number };
    };
    const e = json?.ethereum ?? {};
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      usd: num(e.usd),
      change24h: num(e.usd_24h_change),
      marketCap: num(e.usd_market_cap),
    };
  } catch {
    return { usd: null, change24h: null, marketCap: null };
  }
}
