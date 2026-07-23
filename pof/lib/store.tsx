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
import type {
  ActivityEntry,
  Cycle,
  DeployConfig,
  Toast,
  UserEngine,
  UserProfile,
  WalletState,
} from "@/types";
import {
  ACTIVITY_POOL,
  ACTIVITY_SEED,
  CYCLE_SEED,
  DEMO_PROFILE,
  DEMO_WALLET,
  FEES_SERIES_SEED,
  GENESIS,
  SEED_ENGINES,
} from "@/data/mock-data";

const STORAGE_KEY = "pof-demo-state-v1";
const RECENT_WALLET_KEY = "pof-recent-wallet";

export type ModalKind = "signin" | "wallet" | "deploy" | "launch" | null;
type GateLevel = "user" | "wallet";

// ---------------------------------------------------------------------------
// live simulation state — driven by a 1s reducer tick so every panel shares
// one consistent clock (countdown, epochs, feed, speed jitter)
// ---------------------------------------------------------------------------

interface SimState {
  tick: number;
  speed: number;
  epoch: number;
  nextCycle: number;
  feesRouted: number;
  totalCycles: number;
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
  cycles: CYCLE_SEED,
  activity: ACTIVITY_SEED,
  feesSeries: FEES_SERIES_SEED,
  nextActivityId: 100,
};

type SimAction =
  | { type: "TICK"; rand: [number, number, number] }
  | { type: "PUSH_ACTIVITY"; tag: string; text: string; tone: ActivityEntry["tone"] }
  | { type: "EXECUTE_CYCLE"; amount: number };

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

function simReducer(state: SimState, action: SimAction): SimState {
  if (action.type === "PUSH_ACTIVITY") {
    return {
      ...state,
      ...pushEntry(state, { tag: action.tag, text: action.text, tone: action.tone }, state.tick),
    };
  }

  // a creator deposit executes the routing cycle immediately
  if (action.type === "EXECUTE_CYCLE") {
    const epoch = state.epoch + 1;
    const amount = action.amount;
    const settled = state.cycles[0];
    const newCycle: Cycle = {
      epoch,
      feesIn: amount,
      liquidity: amount * 0.35,
      burn: amount * 0.2,
      community: amount * 0.105,
      status: "Processing",
      atTick: state.tick,
    };
    let next: SimState = {
      ...state,
      epoch,
      nextCycle: 480,
      totalCycles: state.totalCycles + 1,
      feesRouted: state.feesRouted + amount,
      cycles: [
        newCycle,
        ...state.cycles.map((c, i) => (i === 0 ? { ...c, status: "Complete" as const } : c)),
      ].slice(0, 12),
      feesSeries: [
        ...state.feesSeries,
        { epoch: settled.epoch, fees: settled.feesIn },
      ].slice(-24),
    };
    next = {
      ...next,
      ...pushEntry(
        next,
        { tag: "reserve", text: `creator deposit received · ${amount.toFixed(2)} SOL`, tone: "neutral" },
        state.tick
      ),
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

  const [r1, r2, r3] = action.rand;
  const tick = state.tick + 1;
  let next: SimState = {
    ...state,
    tick,
    feesRouted: state.feesRouted + 0.0009 + r1 * 0.0007,
    nextCycle: state.nextCycle - 1,
  };

  // periodic feed entry + speed jitter
  if (tick % 6 === 0) {
    const template = ACTIVITY_POOL[Math.floor(tick / 6) % ACTIVITY_POOL.length];
    next = {
      ...next,
      speed: Math.min(93.6, Math.max(90.6, state.speed + (r2 - 0.5) * 0.6)),
      ...pushEntry(next, { tag: template.tag, text: template.text(r3), tone: template.tone }, tick),
    };
  }

  // epoch rollover
  if (next.nextCycle <= 0) {
    const epoch = state.epoch + 1;
    const fees = 0.3 + r3 * 0.5;
    const settled = state.cycles[0];
    const newCycle: Cycle = {
      epoch,
      feesIn: fees,
      liquidity: fees * 0.35,
      burn: fees * 0.2,
      community: fees * 0.105,
      status: "Processing",
      atTick: tick,
    };
    next = {
      ...next,
      epoch,
      nextCycle: 480 + Math.floor(r1 * 120),
      totalCycles: state.totalCycles + 1,
      cycles: [
        newCycle,
        ...state.cycles.map((c, i) => (i === 0 ? { ...c, status: "Complete" as const } : c)),
      ].slice(0, 12),
      feesSeries: [
        ...state.feesSeries,
        { epoch: settled.epoch, fees: settled.feesIn },
      ].slice(-24),
    };
    next = {
      ...next,
      ...pushEntry(next, { tag: "cycle", text: `epoch #${epoch} opened`, tone: "green" }, tick),
    };
  }

  return next;
}

// ---------------------------------------------------------------------------
// context
// ---------------------------------------------------------------------------

interface PofStore extends SimState {
  user: UserProfile | null;
  wallet: WalletState | null;
  engines: UserEngine[];
  recentWallet: string | null;
  modal: ModalKind;
  deployConfig: DeployConfig | null;
  toasts: Toast[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openModal: (m: ModalKind) => void;
  closeModal: () => void;
  signIn: (provider: string) => void;
  connectWallet: (providerName: string) => void;
  disconnect: () => void;
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
  /** run action if the required access level is met, otherwise open the right modal and continue after auth */
  gate: (level: GateLevel, action: () => void) => void;
  requestDeploy: (cfg: DeployConfig) => void;
  completeDeploy: (cfg: DeployConfig) => void;
  logActivity: (tag: string, text: string, tone?: ActivityEntry["tone"]) => void;
  /** deposit claimed creator rewards and execute the routing cycle */
  depositAndExecute: (amount: number) => boolean;
}

const PofContext = createContext<PofStore | null>(null);

export function PofProvider({ children }: { children: React.ReactNode }) {
  const [sim, dispatch] = useReducer(simReducer, initialSim);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [engines, setEngines] = useState<UserEngine[]>([]);
  const [recentWallet, setRecentWallet] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [deployConfig, setDeployConfig] = useState<DeployConfig | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const toastId = useRef(1);
  const pending = useRef<{ level: GateLevel; run: () => void } | null>(null);
  const hydrated = useRef(false);

  // 1s simulation clock
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: "TICK", rand: [Math.random(), Math.random(), Math.random()] });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // hydrate persisted demo session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          user?: UserProfile | null;
          wallet?: WalletState | null;
          engines?: UserEngine[];
        };
        if (saved.user) setUser(saved.user);
        if (saved.wallet) setWallet(saved.wallet);
        if (saved.engines?.length) setEngines(saved.engines);
      }
      setRecentWallet(localStorage.getItem(RECENT_WALLET_KEY));
    } catch {
      // corrupted local state — start clean
    }
    hydrated.current = true;
  }, []);

  // persist demo session
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, wallet, engines }));
    } catch {
      // storage unavailable — demo still works in-memory
    }
  }, [user, wallet, engines]);

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

  const signIn = useCallback(
    (provider: string) => {
      setUser(DEMO_PROFILE);
      setEngines((prev) => (prev.length ? prev : SEED_ENGINES));
      toast(`signed in as ${DEMO_PROFILE.username}`);
      if (provider === "solana") {
        setModal("wallet");
        return;
      }
      const p = pending.current;
      if (p?.level === "wallet") {
        setModal("wallet");
      } else {
        setModal(null);
        if (p) {
          pending.current = null;
          p.run();
        }
      }
    },
    [toast]
  );

  const connectWallet = useCallback(
    (providerName: string) => {
      setUser((u) => u ?? DEMO_PROFILE);
      setEngines((prev) => (prev.length ? prev : SEED_ENGINES));
      setWallet({ ...DEMO_WALLET, provider: providerName });
      setRecentWallet(providerName);
      try {
        localStorage.setItem(RECENT_WALLET_KEY, providerName);
      } catch {
        // ignore
      }
      toast(`wallet connected — ${DEMO_WALLET.address}`);
      setModal(null);
      const p = pending.current;
      if (p) {
        pending.current = null;
        p.run();
      }
    },
    [toast]
  );

  const disconnect = useCallback(() => {
    setUser(null);
    setWallet(null);
    pending.current = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    toast("wallet disconnected", "info");
  }, [toast]);

  const gate = useCallback(
    (level: GateLevel, action: () => void) => {
      if (!user) {
        pending.current = { level, run: action };
        setModal("signin");
        return;
      }
      if (level === "wallet" && !wallet) {
        pending.current = { level, run: action };
        setModal("wallet");
        return;
      }
      action();
    },
    [user, wallet]
  );

  const requestDeploy = useCallback((cfg: DeployConfig) => {
    setDeployConfig(cfg);
    setModal("deploy");
  }, []);

  const depositAndExecute = useCallback(
    (amount: number) => {
      if (!wallet) return false;
      if (!(amount > 0) || amount > wallet.claimedRewards) return false;
      setWallet({ ...wallet, claimedRewards: wallet.claimedRewards - amount });
      dispatch({ type: "EXECUTE_CYCLE", amount });
      toast(`cycle executed — ${amount.toFixed(2)} SOL routed`);
      return true;
    },
    [wallet, toast]
  );

  const completeDeploy = useCallback(
    (cfg: DeployConfig) => {
      const slug = cfg.slug || "new-engine";
      setEngines((prev) => [
        ...prev,
        {
          id: `${slug}-${Date.now()}`,
          name: cfg.tokenName || "Untitled Engine",
          statusLabel: "Provisioning",
          status: "deployed",
          mode: cfg.mode,
          slug,
        },
      ]);
      logActivity("launch", `new engine "${slug}" deployed — dashboard provisioning`, "amber");
      toast("engine deployed — added to my engines");
    },
    [logActivity, toast]
  );

  const value = useMemo<PofStore>(
    () => ({
      ...sim,
      user,
      wallet,
      engines,
      recentWallet,
      modal,
      deployConfig,
      toasts,
      searchQuery,
      setSearchQuery,
      openModal,
      closeModal,
      signIn,
      connectWallet,
      disconnect,
      toast,
      dismissToast,
      gate,
      requestDeploy,
      completeDeploy,
      logActivity,
      depositAndExecute,
    }),
    [
      sim,
      user,
      wallet,
      engines,
      recentWallet,
      modal,
      deployConfig,
      toasts,
      searchQuery,
      openModal,
      closeModal,
      signIn,
      connectWallet,
      disconnect,
      toast,
      dismissToast,
      gate,
      requestDeploy,
      completeDeploy,
      logActivity,
      depositAndExecute,
    ]
  );

  return <PofContext.Provider value={value}>{children}</PofContext.Provider>;
}

export function usePof(): PofStore {
  const ctx = useContext(PofContext);
  if (!ctx) throw new Error("usePof must be used inside PofProvider");
  return ctx;
}
