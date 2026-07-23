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

export type ModalKind = "signin" | "wallet" | "deploy" | null;
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
  | { type: "PUSH_ACTIVITY"; tag: string; text: string; tone: ActivityEntry["tone"] };

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

  const [r1, r2, r3] = action.rand;
  const tick = state.tick + 1;
  let next: SimState = {
    ...state,
    tick,
    feesRouted: state.feesRouted + 0.008 + r1 * 0.006,
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
    const fees = 2.4 + r3 * 2.2;
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
      nextCycle: 280 + Math.floor(r1 * 60),
      totalCycles: state.totalCycles + 1,
      cycles: [
        newCycle,
        ...state.cycles.map((c, i) => (i === 0 ? { ...c, status: "Complete" as const } : c)),
      ].slice(0, 12),
      feesSeries: [...state.feesSeries.slice(1), { epoch: settled.epoch, fees: settled.feesIn }],
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
      toast(`signed in as ${DEMO_PROFILE.username} — demo session`);
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
      toast(`wallet connected — ${DEMO_WALLET.address} (simulated)`);
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
    toast("disconnected — local demo state reset", "info");
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

  const completeDeploy = useCallback(
    (cfg: DeployConfig) => {
      const slug = cfg.slug || "new-engine";
      setEngines((prev) => [
        ...prev,
        {
          id: `${slug}-${Date.now()}`,
          name: cfg.tokenName || "Untitled Engine",
          statusLabel: "Draft — demo deployment",
          status: "deployed",
          mode: cfg.mode,
          slug,
        },
      ]);
      logActivity("launch", `engine draft "${slug}" deployed in demo mode`, "amber");
      toast("engine deployed in demo mode — added to My Engines");
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
    ]
  );

  return <PofContext.Provider value={value}>{children}</PofContext.Provider>;
}

export function usePof(): PofStore {
  const ctx = useContext(PofContext);
  if (!ctx) throw new Error("usePof must be used inside PofProvider");
  return ctx;
}
