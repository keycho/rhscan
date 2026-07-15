// a token avatar. renders a curated logo when one is mapped for the symbol
// (tokenLogo, a pure static lookup — no db, no render-time fetch), overlaid on a
// generated monogram: a circular gradient hued from the contract address with
// two-letter initials. the logo is a plain lazy <img> that removes itself on load
// failure, so an unmapped or unreachable logo falls back to the monogram — the
// correct, honest default for the memecoins that make up most of the chain.

import { tokenLogo } from "@/src/web/token-logos";
import { TokenLogoImg } from "@/components/TokenLogoImg";

function hueFrom(address: string): number {
  const h = address.replace(/^0x/, "").slice(0, 6);
  const n = parseInt(h || "0", 16);
  return Number.isFinite(n) ? n % 360 : 0;
}

function initials(symbol: string | null, name: string | null): string {
  const src = (symbol || name || "?").replace(/[^a-zA-Z0-9]/g, "");
  return (src.slice(0, 2) || "?").toUpperCase();
}

export function TokenAvatar({
  address,
  symbol,
  name,
  size = 30,
  fontSize = 10,
}: {
  address: string;
  symbol: string | null;
  name?: string | null;
  size?: number;
  fontSize?: number;
}) {
  const hue = hueFrom(address);
  const logo = tokenLogo(symbol);
  return (
    <div
      className="mono relative flex flex-none items-center justify-center overflow-hidden rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize,
        background: `linear-gradient(140deg, hsl(${hue} 62% 46%), hsl(${(hue + 28) % 360} 58% 32%))`,
      }}
      aria-hidden="true"
    >
      {initials(symbol, name ?? null)}
      {logo && <TokenLogoImg src={logo} alt={symbol ?? ""} />}
    </div>
  );
}
