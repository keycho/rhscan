// pruner: roll the window forward by dropping partitions.
//
// deleting tens of gb a day out of a live heap is a losing game (autovacuum
// never keeps up, indexes bloat, vacuum does not return space to the os). with
// range partitioning the pruner just drops whole partitions once they are
// entirely below the window floor: instant, reclaims disk immediately, zero
// vacuum work.
//
// the floor is now WINDOW_BLOCKS below head. the old 7-day guard was a time-based
// floor that rejected every block-count window that actually fits on disk, so it
// is gone: dropPartitionsBelow only ever drops partitions strictly below the
// floor, and the floor can never exceed head, so a bad env var cannot wipe live
// data. never touches cold_* tables, tokens, contracts, or token_balances.

import { getHead } from "./chain.js";
import { sql } from "./db.js";
import { log } from "./log.js";
import { dropPartitionsBelow } from "./partitions.js";
import { findWindowFloor, setSyncValue, WINDOW_FLOOR_KEY } from "./window.js";

const PRUNE_INTERVAL_HOURS = Number(process.env.PRUNE_INTERVAL_HOURS ?? 24);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function pruneOnce(): Promise<void> {
  const head = await getHead();
  const floor = findWindowFloor(head);
  await setSyncValue(WINDOW_FLOOR_KEY, floor);

  const dropped = await dropPartitionsBelow(floor);
  // tidy the work queue so a future widening re-seeds cleanly.
  await sql`delete from backfill_ranges where to_block < ${floor}`;

  if (dropped > 0) {
    log.info(`prune: dropped ${dropped} partition(s) below window floor ${floor}`);
  } else {
    log.info(`prune: no partitions fully below window floor ${floor}`);
  }
}

export async function runPrune(stopped: () => boolean = () => false): Promise<void> {
  log.info(`pruner started, interval ${PRUNE_INTERVAL_HOURS}h`);
  const intervalMs = PRUNE_INTERVAL_HOURS * 3_600_000;
  for (;;) {
    if (stopped()) break;
    try {
      await pruneOnce();
    } catch (err) {
      log.error(`prune run failed: ${String(err)}`);
    }
    const wakeAt = Date.now() + intervalMs;
    while (!stopped() && Date.now() < wakeAt) await sleep(1000);
  }
  log.info("pruner stopped");
}
