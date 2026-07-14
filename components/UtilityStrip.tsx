// the top utility strip: live eth price + gas on the left, chain identity on the
// right. present on every page. eth price and gas are real (coingecko + median
// base fee); a failure renders a dash rather than blocking.

import { formatGwei, formatUsd } from "@/src/web/format";

export function UtilityStrip({
  ethUsd,
  gasWei,
}: {
  ethUsd: number | null;
  gasWei: string | null;
}) {
  const eth = ethUsd != null ? formatUsd(ethUsd) : "—";
  const gas = gasWei != null ? `${formatGwei(gasWei)} gwei` : "—";

  return (
    <div className="border-b border-border bg-utility">
      <div className="mono mx-auto flex h-8 max-w-page items-center justify-between px-[22px] text-[11.5px]">
        <div className="flex items-center gap-[14px] text-label">
          <span>
            eth <span className="font-semibold text-green">{eth}</span>
          </span>
          <span className="h-[11px] w-px bg-border" />
          <span>
            gas <span className="font-semibold text-green">{gas}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-label">
          <span>
            chain <span className="text-tertiary">4663</span>
          </span>
          <span className="h-[11px] w-px bg-border" />
          <span className="text-muted">orbit l2 · arbitrum</span>
        </div>
      </div>
    </div>
  );
}
