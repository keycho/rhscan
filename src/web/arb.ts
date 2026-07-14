// arbitrum orbit l2 fee decomposition. this is the number most explorers get
// wrong, so the maths is spelled out.
//
// on nitro, a transaction's receipt `gasUsed` ALREADY INCLUDES an l1 data
// component, `gasUsedForL1`, which is the poster's l1 calldata cost converted
// into l2 gas units at the prevailing l1 base fee. every unit of that gas is
// charged at the same `effectiveGasPrice` as execution gas. so:
//
//   totalFee   = gasUsed          * effectiveGasPrice
//   l1DataFee  = gasUsedForL1     * effectiveGasPrice
//   l2ExecFee  = (gasUsed - gasUsedForL1) * effectiveGasPrice
//   totalFee   = l1DataFee + l2ExecFee            (exactly, by construction)
//
// the common mistake is to treat `gasUsed` as pure execution gas and then add a
// separately-fetched l1 fee on top, double counting the data cost. we never do
// that: we split the single gasUsed figure, we do not add to it.

import type { TxView } from "../resolve.js";

export interface FeeBreakdown {
  effectiveGasPriceWei: string | null;
  gasUsed: number | null;
  gasUsedForL1: number | null;
  l2GasUsed: number | null;
  totalFeeWei: string | null;
  l1FeeWei: string | null;
  l2FeeWei: string | null;
  l1SharePct: number | null;
  // true when the receipt carried no gasUsedForL1, so we can only show the total
  // and must not invent a split.
  hasL1Split: boolean;
}

export function feeBreakdown(tx: TxView): FeeBreakdown {
  const price = tx.effectiveGasPrice != null ? BigInt(tx.effectiveGasPrice) : null;
  const gasUsed = tx.gasUsed;
  const gasForL1 = tx.gasUsedForL1;

  if (price == null || gasUsed == null) {
    return {
      effectiveGasPriceWei: tx.effectiveGasPrice,
      gasUsed,
      gasUsedForL1: gasForL1,
      l2GasUsed: null,
      totalFeeWei: null,
      l1FeeWei: null,
      l2FeeWei: null,
      l1SharePct: null,
      hasL1Split: false,
    };
  }

  const totalFee = BigInt(gasUsed) * price;

  if (gasForL1 == null) {
    return {
      effectiveGasPriceWei: tx.effectiveGasPrice,
      gasUsed,
      gasUsedForL1: null,
      l2GasUsed: gasUsed,
      totalFeeWei: totalFee.toString(),
      l1FeeWei: null,
      l2FeeWei: totalFee.toString(),
      l1SharePct: null,
      hasL1Split: false,
    };
  }

  // clamp: gasUsedForL1 should never exceed gasUsed, but a malformed receipt
  // must not produce a negative execution figure.
  const l1Gas = Math.min(gasForL1, gasUsed);
  const l2Gas = gasUsed - l1Gas;
  const l1Fee = BigInt(l1Gas) * price;
  const l2Fee = BigInt(l2Gas) * price;
  const l1SharePct = totalFee > 0n ? Number((l1Fee * 10000n) / totalFee) / 100 : 0;

  return {
    effectiveGasPriceWei: tx.effectiveGasPrice,
    gasUsed,
    gasUsedForL1: l1Gas,
    l2GasUsed: l2Gas,
    totalFeeWei: totalFee.toString(),
    l1FeeWei: l1Fee.toString(),
    l2FeeWei: l2Fee.toString(),
    l1SharePct,
    hasL1Split: true,
  };
}
