import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  fetchJson,
  normalizeLedgerRow,
  normalizeRail,
  normalizeReserves,
  unwrapList,
  type LedgerRow,
  type RailHealth,
  type ReserveSnapshot,
} from "@/lib/straitsx";
import { useStraitsXStore } from "@/lib/straitsx-store";

const POLL_MS = 5_000;
const SIM_TICK_MS = 3_000;

export interface DualRailFeed<T> {
  data: T;
  isLoading: boolean;
  isFetching: boolean;
  live: boolean;
  updatedAt: number;
}

/**
 * Single unified hook covering all three dual-rail feeds.
 * Integrates live simulation store (background interval ticking FX, status transitions, latencies)
 * and falls back gracefully to cloud polling.
 */
export function useStraitsXDualRail() {
  const store = useStraitsXStore();

  // Background interval loop for simulation data breathing
  useEffect(() => {
    const timer = setInterval(() => {
      store.tickSimulation();
    }, SIM_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // Poll cloud endpoints in background if reachable
  const cloudLedger = useQuery({
    queryKey: ["straitsx", "ledger"],
    queryFn: async ({ signal }) => {
      const raw = await fetchJson("/api/ledger", signal);
      const parsed = unwrapList(raw).map(normalizeLedgerRow);
      store.setLedger(parsed);
      return parsed;
    },
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: 1,
  });

  const cloudRails = useQuery({
    queryKey: ["straitsx", "rails"],
    queryFn: async ({ signal }) => {
      const raw = await fetchJson("/api/rails/health", signal);
      const parsed = unwrapList(raw).map(normalizeRail);
      store.setRails(parsed);
      return parsed;
    },
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: 1,
  });

  const cloudReserves = useQuery({
    queryKey: ["straitsx", "reserves"],
    queryFn: async ({ signal }) => {
      const raw = await fetchJson("/api/treasury/reserves", signal);
      const parsed = normalizeReserves(raw);
      store.setReserves(parsed);
      return parsed;
    },
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: 1,
  });

  const live = !!(cloudLedger.data || cloudRails.data || cloudReserves.data);

  return {
    ledger: {
      data: store.ledger,
      isLoading: false,
      isFetching: cloudLedger.isFetching,
      live,
      updatedAt: store.lastTick,
    } as DualRailFeed<LedgerRow[]>,
    rails: {
      data: store.rails,
      isLoading: false,
      isFetching: cloudRails.isFetching,
      live,
      updatedAt: store.lastTick,
    } as DualRailFeed<RailHealth[]>,
    reserves: {
      data: store.reserves,
      isLoading: false,
      isFetching: cloudReserves.isFetching,
      live,
      updatedAt: store.lastTick,
    } as DualRailFeed<ReserveSnapshot>,
    live,
    // Store mutation actions
    approveTransaction: store.approveTransaction,
    overrideRail: store.overrideRail,
    rejectTransaction: store.rejectTransaction,
    pauseRail: store.pauseRail,
  };
}

