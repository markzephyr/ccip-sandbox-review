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
