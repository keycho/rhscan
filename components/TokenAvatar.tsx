// a generated token avatar: a circular gradient whose hue is derived from the
// contract address, with two-letter monospace initials. a stable stand-in until
// real token logos are available.

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
  return (
    <div
      className="mono flex flex-none items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize,
        background: `linear-gradient(140deg, hsl(${hue} 62% 46%), hsl(${(hue + 28) % 360} 58% 32%))`,
      }}
      aria-hidden="true"
    >
      {initials(symbol, name ?? null)}
    </div>
  );
}
