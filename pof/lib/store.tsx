"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { ActivityEntry, Cycle, Toast } from "@/types";
import {
  ACTIVITY_POOL,
  ACTIVITY_SEED,
  CYCLE_SEED,
  FEES_SERIES_SEED,
  GENESIS,
} from "@/data/mock-data";

export type ModalKind = "wallet" | "activate" | null;

// ---------------------------------------------------------------------------
// PROTOCOL SIMULATION — the genesis flywheel shown on this site is
// demonstration data driven by a local 1s clock. nothing in this reducer is,
// or is presented as, a confirmed onchain transaction. real wallet state
// comes from @solana/wallet-adapter-react, entirely separate from this store.
// ---------------------------------------------------------------------------

interface SimState {
  tick: number;
  speed: number;
  epoch: number;
  nextCycle: number;
  feesRouted: number;
  totalCycles: number;
  flywheelBalance: number;
  cycles: Cycle[];
  activity: ActivityEntry[];
  feesSeries: { epoch: number; fees: number }[];
  nextActivityId: number;
}

const initialSim: SimState = {
  tick: 0,
  speed: GENESIS.flywheelSpeed,
  epoch: GENESIS.epoch,
  nextCycle: GENESIS.nextCycleSeconds,
  feesRouted: GENESIS.feesRouted,
  totalCycles: GENESIS.totalCycles,
  flywheelBalance: 0,
  cycles: CYCLE_SEED,
  activity: ACTIVITY_SEED,
  feesSeries: FEES_SERIES_SEED,
  nextActivityId: 100,
};

type SimAction =
  | { type: "TICK"; rand: [number, number, number] }
  | { type: "PUSH_ACTIVITY"; tag: string; text: string; tone: ActivityEntry["tone"] }
  | { type: "DEPOSIT"; amount: number }
  | { type: "EXECUTE_CYCLE"; extra: number };

function pushEntry(
  state: SimState,
  entry: Omit<ActivityEntry, "id" | "atTick">,
  atTick: number
): Pick<SimState, "activity" | "nextActivityId"> {
  return {
    activity: [{ ...entry, id: state.nextActivityId, atTick }, ...state.activity].slice(0, 24),
    nextActivityId: state.nextActivityId + 1,
  };
}

function executeCycle(state: SimState, amount: number): SimState {
  const epoch = state.epoch + 1;
  const settled = state.cycles[0];
  const newCycle: Cycle = {
    epoch,
    feesIn: amount,
    liquidity: amount * 0.35,
    burn: amount * 0.2,
    community: amount * 0.1,
    status: "Processing",
    atTick: state.tick,
  };
  let next: SimState = {
    ...state,
    epoch,
    nextCycle: 480,
    totalCycles: state.totalCycles + 1,
    feesRouted: state.feesRouted + amount,
    flywheelBalance: 0,
    cycles: [
      newCycle,
      ...state.cycles.map((c, i) => (i === 0 ? { ...c, status: "Complete" as const } : c)),
    ].slice(0, 12),
    feesSeries: [...state.feesSeries, { epoch: settled.epoch, fees: settled.feesIn }].slice(-24),
  };
  next = {
    ...next,
    ...pushEntry(
      next,
      { tag: "cycle", text: `cycle #${epoch} executing — routing ${amount.toFixed(2)} SOL`, tone: "green" },
      state.tick
    ),
  };
  return next;
}

function simReducer(state: SimState, action: SimAction): SimState {
  if (action.type === "PUSH_ACTIVITY") {
    return {
      ...state,
      ...pushEntry(state, { tag: action.tag, text: action.text, tone: action.tone }, state.tick),
    };
  }

  if (action.type === "DEPOSIT") {
    let next = { ...state, flywheelBalance: state.flywheelBalance + action.amount };
    next = {
      ...next,
      ...pushEntry(
        next,
        { tag: "reserve", text: `deposit added · ${action.amount.toFixed(2)} SOL`, tone: "neutral" },
        state.tick
      ),
    };
    return next;
  }

  if (action.type === "EXECUTE_CYCLE") {
    const total = Math.round((state.flywheelBalance + action.extra) * 100) / 100;
    if (!(total > 0)) return state;
    return executeCycle(state, total);
  }

  const [r1, r2, r3] = action.rand;
  const tick = state.tick + 1;
  let next: SimState = { ...state, tick, nextCycle: state.nextCycle - 1 };

  // periodic feed entry + speed jitter
  if (tick % 6 === 0) {
    const template = ACTIVITY_POOL[Math.floor(tick / 6) % ACTIVITY_POOL.length];
    next = {
      ...next,
      speed: Math.min(93.6, Math.max(90.6, state.speed + (r2 - 0.5) * 0.6)),
      ...pushEntry(next, { tag: template.tag, text: template.text(r3), tone: template.tone }, tick),
    };
  }

  // the simulated genesis creator tops the wheel up periodically
  if (tick % 60 === 30) {
    const amt = Math.round((0.03 + r1 * 0.09) * 1000) / 1000;
    next = { ...next, flywheelBalance: next.flywheelBalance + amt };
    next = {
      ...next,
      ...pushEntry(
        next,
        { tag: "reserve", text: `creator deposit received · ${amt.toFixed(3)} SOL`, tone: "neutral" },
        tick
      ),
    };
  }

  // scheduled cycle: only executes when there is a deposited balance to route
  if (next.nextCycle <= 0) {
    if (next.flywheelBalance > 0) {
      next = executeCycle(next, Math.round(next.flywheelBalance * 100) / 100);
    } else {
      next = { ...next, nextCycle: 480 + Math.floor(r1 * 120) };
    }
  }

  return next;
}

// ---------------------------------------------------------------------------
// context
// ---------------------------------------------------------------------------

interface PofStore extends SimState {
  modal: ModalKind;
  toasts: Toast[];
  searchQuery: string;
  /** when true, a successful wallet connection continues into the wizard */
  pendingActivate: boolean;
  setPendingActivate: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  openModal: (m: ModalKind) => void;
  closeModal: () => void;
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
  logActivity: (tag: string, text: string, tone?: ActivityEntry["tone"]) => void;
  /** genesis demo engine interactions — config/sim state only, never a transaction */
  simDeposit: (amount: number) => void;
  simExecuteCycle: (extra: number) => void;
}

const PofContext = createContext<PofStore | null>(null);

export function PofProvider({ children }: { children: React.ReactNode }) {
  const [sim, dispatch] = useReducer(simReducer, initialSim);
  const [modal, setModal] = useState<ModalKind>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingActivate, setPendingActivate] = useState(false);
  const toastId = useRef(1);

  // 1s simulation clock
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: "TICK", rand: [Math.random(), Math.random(), Math.random()] });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const toast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-3), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const openModal = useCallback((m: ModalKind) => setModal(m), []);
  const closeModal = useCallback(() => setModal(null), []);

  const logActivity = useCallback(
    (tag: string, text: string, tone: ActivityEntry["tone"] = "neutral") => {
      dispatch({ type: "PUSH_ACTIVITY", tag, text, tone });
    },
    []
  );

  const simDeposit = useCallback(
    (amount: number) => {
      dispatch({ type: "DEPOSIT", amount });
      toast(`${amount.toFixed(2)} SOL added to the flywheel balance`);
    },
    [toast]
  );

  const simExecuteCycle = useCallback(
    (extra: number) => {
      if (extra > 0) dispatch({ type: "DEPOSIT", amount: extra });
      dispatch({ type: "EXECUTE_CYCLE", extra: 0 });
      toast("cycle executed — balance routed through the engine");
    },
    [toast]
  );

  const value = useMemo<PofStore>(
    () => ({
      ...sim,
      modal,
      toasts,
      searchQuery,
      pendingActivate,
      setPendingActivate,
      setSearchQuery,
      openModal,
      closeModal,
      toast,
      dismissToast,
      logActivity,
      simDeposit,
      simExecuteCycle,
    }),
    [
      sim,
      modal,
      toasts,
      searchQuery,
      pendingActivate,
      openModal,
      closeModal,
      toast,
      dismissToast,
      logActivity,
      simDeposit,
      simExecuteCycle,
    ]
  );

  return <PofContext.Provider value={value}>{children}</PofContext.Provider>;
}

export function usePof(): PofStore {
  const ctx = useContext(PofContext);
  if (!ctx) throw new Error("usePof must be used inside PofProvider");
  return ctx;
}
