// a small static 4-byte selector -> signature table. this chain has no verified
// source and no signature database wired in, so we decode the common erc-20,
// erc-721, erc-1155 and router selectors by hand and fall back to the raw
// selector for everything else. facts only: we never claim a call is something
// we cannot prove from its four bytes.

const KNOWN: Record<string, string> = {
  "0xa9059cbb": "transfer(address,uint256)",
  "0x23b872dd": "transferFrom(address,address,uint256)",
  "0x095ea7b3": "approve(address,uint256)",
  "0xa22cb465": "setApprovalForAll(address,bool)",
  "0x40c10f19": "mint(address,uint256)",
  "0x6a627842": "mint(address)",
  "0x1249c58b": "mint()",
  "0x42966c68": "burn(uint256)",
  "0x9dc29fac": "burn(address,uint256)",
  "0xd0e30db0": "deposit()",
  "0x2e1a7d4d": "withdraw(uint256)",
  "0x3ccfd60b": "withdraw()",
  "0x42842e0e": "safeTransferFrom(address,address,uint256)",
  "0xb88d4fde": "safeTransferFrom(address,address,uint256,bytes)",
  "0xf242432a": "safeTransferFrom(address,address,uint256,uint256,bytes)",
  "0x2eb2c2d6": "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
  "0xac9650d8": "multicall(bytes[])",
  "0x5ae401dc": "multicall(uint256,bytes[])",
  "0x3593564c": "execute(bytes,bytes[],uint256)",
  "0x7ff36ab5": "swapExactETHForTokens(uint256,address[],address,uint256)",
  "0x38ed1739": "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
  "0x18cbafe5": "swapExactTokensForETH(uint256,uint256,address[],address,uint256)",
  "0x8803dbee": "swapTokensForExactTokens(uint256,uint256,address[],address,uint256)",
  "0x5c11d795":
    "swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)",
  "0xfb3bdb41": "swapETHForExactTokens(uint256,address[],address,uint256)",
  "0x128acb08": "swap(address,bool,int256,uint160,bytes)",
  "0x022c0d9f": "swap(uint256,uint256,address,bytes)",
  "0xe8e33700": "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
  "0xf305d719": "addLiquidityETH(address,uint256,uint256,uint256,address,uint256)",
};

// the short label used in tables: the function name only, e.g. "transfer".
export function methodLabel(methodId: string | null | undefined): string {
  if (!methodId || methodId === "0x") return "transfer eth";
  const sig = KNOWN[methodId.toLowerCase()];
  if (sig) return sig.slice(0, sig.indexOf("("));
  return methodId.toLowerCase();
}

// the full known signature, or null when the selector is unknown.
export function methodSignature(methodId: string | null | undefined): string | null {
  if (!methodId || methodId === "0x") return null;
  return KNOWN[methodId.toLowerCase()] ?? null;
}
