// curated, static token logos. resolved at render by a pure string lookup — no
// database, no render-time network fetch. the browser lazy-loads the <img>, and
// any load failure falls back to the generated monogram (see TokenAvatar /
// TokenLogoImg). the vast majority of tokens (memecoins) have no entry and stay
// monograms, which is the correct, honest default.
//
// NOTE: keyed by SYMBOL, not contract address. an impersonator contract reusing a
// listed ticker would show that ticker's logo; the explorer's name-collision
// panels stay the source of truth for telling real from fake. if verified
// robinhood-chain contract addresses become available, switch to address-keying.

// robinhood chain tokenized stocks / ETFs. parqet serves a logo per ticker at
// a stable static url; unknown tickers 404 and fall back to the monogram.
const STOCK_TICKERS = new Set([
  // mega-cap tech
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "GOOG", "META", "TSLA", "AVGO", "AMD",
  // popular single names
  "PLTR", "NFLX", "COIN", "HOOD", "MSTR", "INTC", "MU", "QCOM", "ORCL", "CRM",
  "ADBE", "CSCO", "IBM", "UBER", "ABNB", "SHOP", "PYPL", "SOFI", "SNOW", "DELL",
  "BAC", "JPM", "V", "MA", "DIS", "KO", "PEP", "MCD", "NKE", "WMT",
  "COST", "BABA", "F", "GM", "BA", "GE", "XOM", "CVX", "PFE", "JNJ",
  "LLY", "UNH", "BRK.B", "T", "VZ",
  // etfs
  "SPY", "QQQ", "VOO", "VTI", "IWM", "DIA", "ARKK", "GLD", "TQQQ",
]);

// explicit overrides: crypto tokens, or any ticker parqet does not cover.
const LOGO_OVERRIDES: Record<string, string> = {
  VIRTUAL: "https://assets.coingecko.com/coins/images/34057/large/LOGOMARK.png",
  USDG: "https://coin-images.coingecko.com/coins/images/51281/large/GDN_USDG_Token_200x200.png",
};

// the logo url for a token symbol, or null to use the monogram fallback. pure and
// synchronous: safe to call in a server component's render with zero latency.
export function tokenLogo(symbol: string | null | undefined): string | null {
  if (!symbol) return null;
  const s = symbol.trim().replace(/^\$/, "").toUpperCase();
  if (!s) return null;
  if (s in LOGO_OVERRIDES) return LOGO_OVERRIDES[s]!;
  if (STOCK_TICKERS.has(s)) return `https://assets.parqet.com/logos/symbol/${encodeURIComponent(s)}`;
  return null;
}
