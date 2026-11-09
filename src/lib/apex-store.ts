import { useSyncExternalStore } from "react";
import { demoLedger, demoRails, demoReserves } from "./apex-demo";
import {
  normalizeLedgerRow,
  normalizeRail,
  normalizeReserves,
  unwrapList,
  type LedgerRow,
  type RailHealth,
  type ReserveSnapshot,
} from "./apex";

export interface ApexRailState {
  ledger: LedgerRow[];
  rails: RailHealth[];
  reserves: ReserveSnapshot;
  lastTick: number;
}

let currentState: ApexRailState = {
  ledger: unwrapList(demoLedger).map(normalizeLedgerRow),
  rails: unwrapList(demoRails).map(normalizeRail),
  reserves: normalizeReserves(demoReserves),
  lastTick: Date.now(),
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function updateState(updater: (prev: ApexRailState) => ApexRailState) {
  currentState = updater(currentState);
  notify();
}

export const apexActions = {
  approveTransaction: (id: string) => {
    updateState((state) => ({
      ...state,
      ledger: state.ledger.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              status: "settled" as const,
              requiresApproval: false,
              date: new Date().toISOString(),
            }
          : tx,
      ),
    }));
  },

  overrideRail: (id: string, newRail: string) => {
    updateState((state) => ({
      ...state,
      ledger: state.ledger.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              destinationRail: newRail,
              status: "processing" as const,
              requiresApproval: false,
              date: new Date().toISOString(),
            }
          : tx,
      ),
    }));
  },

  rejectTransaction: (id: string) => {
    updateState((state) => ({
      ...state,
      ledger: state.ledger.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              status: "failed" as const,
              requiresApproval: false,
            }
          : tx,
      ),
    }));
  },

  pauseRail: (id: string, forcePaused?: boolean) => {
    updateState((state) => ({
      ...state,
      rails: state.rails.map((r) => {
        if (r.id !== id) return r;
        const isPaused = forcePaused !== undefined ? forcePaused : r.status !== "paused";
        return {
          ...r,
          status: isPaused ? ("paused" as const) : ("operational" as const),
        };
      }),
    }));
  },

  setLedger: (ledger: LedgerRow[]) => {
    updateState((state) => ({ ...state, ledger }));
  },

  setRails: (rails: RailHealth[]) => {
    updateState((state) => ({ ...state, rails }));
  },

  setReserves: (reserves: ReserveSnapshot) => {
    updateState((state) => ({ ...state, reserves }));
  },

  // Live simulation tick: ticks FX rates, advances status pipelines, realistically fluctuates latencies
  tickSimulation: () => {
    updateState((state) => {
      // 1. Tick FX rates slightly (jitter +/- 0.05%)
      const updatedLedger = state.ledger.map((tx) => {
        const delta = (Math.random() - 0.49) * 0.0008;
        const newFxRate = Math.max(0.0001, Number((tx.fxRate * (1 + delta)).toFixed(4)));

        // Probabilistically transition pending/processing transactions
        let newStatus = tx.status;
        const requiresApproval = tx.requiresApproval;

        if (tx.status === "pending" && !tx.requiresApproval && Math.random() < 0.25) {
          newStatus = "processing";
        } else if (tx.status === "processing" && Math.random() < 0.3) {
          newStatus = "settled";
        }

        return {
          ...tx,
          fxRate: newFxRate,
          status: newStatus,
          requiresApproval,
        };
      });

      // 2. Realistic regional rail latency fluctuation
      const updatedRails = state.rails.map((rail) => {
        if (rail.status === "paused") return rail;

        let baseMin = 380;
        let baseMax = 550;
        if (rail.id === "bifast-id") {
          baseMin = 1150;
          baseMax = 1450;
        } else if (rail.id === "eth") {
          baseMin = 11800;
          baseMax = 13200;
        } else if (rail.id === "polygon") {
          baseMin = 1950;
          baseMax = 2400;
        } else if (rail.id === "avalanche") {
          baseMin = 1800;
          baseMax = 2100;
        } else if (rail.id === "fast-sg" || rail.id === "paynow-sg") {
          baseMin = 360;
          baseMax = 490;
        }

        const delta = Math.floor((Math.random() - 0.5) * 50);
        const newLatency = Math.max(
          baseMin - 80,
          Math.min(baseMax + 120, Math.round(rail.latencyMs + delta)),
        );

        // Throughput increments slightly
        const newThroughput =
          rail.throughput24h + (Math.random() > 0.4 ? Math.floor(Math.random() * 4) + 1 : 0);

        return {
          ...rail,
          latencyMs: newLatency,
          throughput24h: newThroughput,
        };
      });

      // 3. Keep reserves dynamically fresh
      const updatedReserves = {
        ...state.reserves,
        updatedAt: new Date().toISOString(),
      };

      return {
        ledger: updatedLedger,
        rails: updatedRails,
        reserves: updatedReserves,
        lastTick: Date.now(),
      };
    });
  },
};

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return currentState;
}

export function useApexStore(): ApexRailState & typeof apexActions {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    ...state,
    ...apexActions,
  };
}
