// eth price from coingecko, server-side, cached 60s. native gas on this chain is
// eth, so this is the only external price the explorer needs. a failure returns
// null and the ui simply omits usd, never blocks a render on it.

export async function getEthUsd(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      {
        // 60s revalidation, per the brief. head-adjacent pages still render
        // instantly from the cached value.
        next: { revalidate: 60 },
        headers: { accept: "application/json" },
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { ethereum?: { usd?: number } };
    const usd = json?.ethereum?.usd;
    return typeof usd === "number" && Number.isFinite(usd) ? usd : null;
  } catch {
    return null;
  }
}
