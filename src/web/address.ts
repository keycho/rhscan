// address page reads.
//
// the transaction list is the read the brief calls out: it must be a single
// bounded index range read, never a scan. the resolver's address helper unions
// the window and cold tables and sorts the union, which for a hot address reads
// every one of its rows before applying the limit. here we instead read each
// table with its own `order by block_number desc, tx_index desc limit N`, which
// the (address, block_number desc, tx_index desc) index serves directly and
// terminates after N rows. the cold table (warmed history only, small) is read
// the same way and merged in memory.
//
// balance, nonce and code are current chain state and are always read live, the
// same primitives the resolver uses. the tx list only ever comes from the index,
// so it is truncated at the window floor and we say so plainly.

import { getBalance, getCode, getTransactionCount } from "../chain.js";
import { sql } from "../db.js";
import { getSyncValue, WINDOW_FLOOR_KEY } from "../window.js";

export interface AddressHeader {
  address: string;
  balance: string;
  nonce: number;
  isContract: boolean;
  codeSize: number;
  creation: { creator: string | null; creationTx: string | null; creationBlock: number | null } | null;
  windowFloor: number | null;
}

export async function addressHeader(address: string): Promise<AddressHeader> {
  const a = address.toLowerCase();
  const [balanceHex, nonceHex, code, windowFloor] = await Promise.all([
    getBalance(a),
    getTransactionCount(a),
    getCode(a),
    getSyncValue(WINDOW_FLOOR_KEY),
  ]);
  const isContract = code != null && code !== "0x";
  const codeSize = isContract ? (code.length - 2) / 2 : 0;

  let creation: AddressHeader["creation"] = null;
  if (isContract) {
    const [c] = await sql<
      { creator: string | null; creation_tx: string | null; creation_block: string | null }[]
    >`
      select creator, creation_tx, creation_block from contracts where address = ${a}
    `;
    if (c) {
      creation = {
        creator: c.creator,
        creationTx: c.creation_tx,
        creationBlock: c.creation_block == null ? null : Number(c.creation_block),
      };
    }
  }

  return {
    address: a,
    balance: BigInt(balanceHex).toString(),
    nonce: Number(BigInt(nonceHex)),
    isContract,
    codeSize,
    creation,
    windowFloor,
  };
}

export interface AddressTxRef {
  blockNumber: number;
  txIndex: number;
  txHash: string;
  direction: string;
}

// bounded index range reads over the window and cold tables, merged newest-first.
// `truncatedAtWindow` is always true for the window list: an address's full
// history predates the window and cannot be reconstructed, so the list only
// covers indexed blocks.
export async function addressTxRefs(
  address: string,
  limit = 50,
): Promise<{ refs: AddressTxRef[]; hasCold: boolean }> {
  const a = address.toLowerCase();

  const [win, cold] = await Promise.all([
    sql<{ block_number: string; tx_index: number; tx_hash: string; direction: string }[]>`
      select block_number, tx_index, tx_hash, direction
        from address_transactions
       where address = ${a}
       order by block_number desc, tx_index desc
       limit ${limit}
    `,
    sql<{ block_number: string; tx_index: number; tx_hash: string; direction: string }[]>`
      select block_number, tx_index, tx_hash, direction
        from cold_address_transactions
       where address = ${a}
       order by block_number desc, tx_index desc
       limit ${limit}
    `,
  ]);

  const map = (r: { block_number: string; tx_index: number; tx_hash: string; direction: string }): AddressTxRef => ({
    blockNumber: Number(r.block_number),
    txIndex: Number(r.tx_index),
    txHash: r.tx_hash,
    direction: r.direction,
  });

  const merged = [...win.map(map), ...cold.map(map)]
    .sort((x, y) => (y.blockNumber - x.blockNumber) || (y.txIndex - x.txIndex))
    .slice(0, limit);

  return { refs: merged, hasCold: cold.length > 0 };
}
