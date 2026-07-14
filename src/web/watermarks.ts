// the three numbers the ui must know to be honest about coverage:
//   head           the latest indexed block (tail worker's watermark)
//   backfillFloor  the contiguous-from-head watermark: every block above this is
//                  fully indexed. this is the number to trust as "complete from
//                  here up".
//   windowFloor    the lowest block the window retains. below it, data resolves
//                  live through the cold-path resolver and is not guaranteed.
//
// one round trip reads all three plus the tail's freshness.

import { sql } from "../db.js";

export interface Watermarks {
  head: number | null;
  headUpdatedAt: string | null;
  backfillFloor: number | null;
  windowFloor: number | null;
}

export async function getWatermarks(): Promise<Watermarks> {
  const rows = await sql<{ worker: string; last_indexed_block: string; updated_at: Date }[]>`
    select worker, last_indexed_block, updated_at
      from sync_state
     where worker in ('tail', 'backfill_floor', 'window_floor')
  `;
  const by = new Map(rows.map((r) => [r.worker, r]));
  const tail = by.get("tail");
  return {
    head: tail ? Number(tail.last_indexed_block) : null,
    headUpdatedAt: tail ? new Date(tail.updated_at).toISOString() : null,
    backfillFloor: by.has("backfill_floor")
      ? Number(by.get("backfill_floor")!.last_indexed_block)
      : null,
    windowFloor: by.has("window_floor")
      ? Number(by.get("window_floor")!.last_indexed_block)
      : null,
  };
}
