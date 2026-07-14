// rolling-window helpers, shared by backfill, prune and resolve.
//
// the explorer indexes only a recent window and falls back to live rpc for
// anything older. this is a deliberate product decision, not a limitation. the
// window floor is a fixed block count below head (WINDOW_BLOCKS): a block-count
// window sizes disk directly (bytes ~ blocks x head density) with no dependency
// on the chain's volatile block time. backfill_floor is the contiguous-from-head
// watermark: the lowest block above which every range is done, and the number
// the ui should trust as "fully indexed from here up".

import { sql, type Executor } from "./db.js";

// blocks of recent history to index. default ~100 GB at measured head density.
export const WINDOW_BLOCKS = Number(process.env.WINDOW_BLOCKS ?? 3_000_000);

// sync_state pseudo-workers used to publish scalars the frontend reads.
export const WINDOW_FLOOR_KEY = "window_floor";
export const BACKFILL_FLOOR_KEY = "backfill_floor";

// the lowest block the window covers: WINDOW_BLOCKS below head, clamped at
// genesis. a single subtraction, no rpc — the floor is now purely block-count
// derived, so it is exact and cheap.
export function findWindowFloor(head: number): number {
  return Math.max(0, head - WINDOW_BLOCKS + 1);
}

export async function setSyncValue(
  worker: string,
  block: number,
  exec: Executor = sql,
): Promise<void> {
  await exec`
    insert into sync_state (worker, last_indexed_block, updated_at)
    values (${worker}, ${block}, now())
    on conflict (worker) do update
      set last_indexed_block = excluded.last_indexed_block, updated_at = now()
  `;
}

export async function getSyncValue(worker: string): Promise<number | null> {
  const rows = await sql<{ last_indexed_block: string }[]>`
    select last_indexed_block from sync_state where worker = ${worker}
  `;
  return rows[0] ? Number(rows[0].last_indexed_block) : null;
}
