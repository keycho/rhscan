// balance-drift check for the holders tab.
//
// day 3 found a token on this chain whose live balanceOf diverges from its own
// Transfer event history. fee-on-transfer, rebasing and blacklist tokens all do
// this, and memecoins are exactly where they live. a holders list replayed from
// Transfer logs is then quietly wrong. rather than show it as fact, we compare
// the replayed top balances against live balanceOf and, on disagreement, flag the
// token so the reader knows the list is unverified.
//
// the comparison is made AT the hydrated block, not latest: an actively traded
// token moves between the snapshot and now, and comparing to a later balanceOf
// would show spurious drift. comparing at the hydrated block isolates whether the
// replay itself is faithful, which is the property we are asserting.

import { erc20Abi } from "viem";
import { client, MULTICALL3_ADDRESS } from "../chain.js";
import type { Holder } from "../holders.js";

const MAX_CHECK = 50;

type MulticallResult<T> = { status: "success"; result: T } | { status: "failure" };

export interface DriftHolder {
  holderAddress: string;
  indexed: string;
  onchain: string | null;
  match: boolean;
}

export interface DriftReport {
  verifiable: boolean;
  flagged: boolean;
  atBlock: number | null;
  checked: number;
  mismatches: number;
  byHolder: Record<string, DriftHolder>;
}

const EMPTY: DriftReport = {
  verifiable: false,
  flagged: false,
  atBlock: null,
  checked: 0,
  mismatches: 0,
  byHolder: {},
};

export async function checkHolderDrift(
  tokenAddress: string,
  hydratedBlock: number | null,
  holders: Holder[],
): Promise<DriftReport> {
  if (holders.length === 0) return EMPTY;

  const sample = holders.slice(0, MAX_CHECK);
  const token = tokenAddress.toLowerCase() as `0x${string}`;
  const contracts = sample.map((h) => ({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf" as const,
    args: [h.holderAddress as `0x${string}`],
  }));

  let results: MulticallResult<bigint>[];
  try {
    results = (await client.multicall({
      contracts,
      allowFailure: true,
      multicallAddress: MULTICALL3_ADDRESS,
      ...(hydratedBlock != null ? { blockNumber: BigInt(hydratedBlock) } : {}),
    })) as MulticallResult<bigint>[];
  } catch {
    // rpc unavailable or the block is beyond the provider's state history. we
    // cannot verify, so we say so rather than assert either way.
    return { ...EMPTY, atBlock: hydratedBlock };
  }

  const byHolder: Record<string, DriftHolder> = {};
  let mismatches = 0;
  let succeeded = 0;

  sample.forEach((h, i) => {
    const r = results[i];
    const onchain = r && r.status === "success" ? r.result : null;
    if (onchain != null) succeeded += 1;
    const indexed = BigInt(h.balance);
    const match = onchain != null && onchain === indexed;
    if (onchain != null && !match) mismatches += 1;
    byHolder[h.holderAddress.toLowerCase()] = {
      holderAddress: h.holderAddress,
      indexed: h.balance,
      onchain: onchain == null ? null : onchain.toString(),
      match,
    };
  });

  return {
    verifiable: succeeded > 0,
    flagged: mismatches > 0,
    atBlock: hydratedBlock,
    checked: succeeded,
    mismatches,
    byHolder,
  };
}
