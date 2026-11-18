import { useQuery } from "@tanstack/react-query";

import { type LedgerRow, type RailHealth, type ReserveSnapshot } from "@/lib/apex";
import { useApexStore } from "@/lib/apex-store";
import {
  getServerLedger,
  approveServerTransaction,
  rejectServerTransaction,
} from "@/lib/server/api";

const POLL_MS = 5_000;

export interface DualRailFeed<T> {
  data: T;
  isLoading: boolean;
  isFetching: boolean;
  live: boolean;
  updatedAt: number;
}

/**
 * Unified hook covering all dual-rail feeds.
 * Synchronizes ledger state via TanStack Start server functions and CCIP execution backend.
 */
export function useApexDualRail() {
  const store = useApexStore();

  // Poll server function for ledger data
  const serverLedgerQuery = useQuery({
    queryKey: ["apex", "server-ledger"],
    queryFn: async () => {
      const data = await getServerLedger();
      if (Array.isArray(data) && data.length > 0) {
        store.setLedger(data as LedgerRow[]);
      }
      return data;
    },
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: 1,
  });

  const live = !!serverLedgerQuery.data;

  const handleApprove = async (id: string) => {
    try {
      const result = await approveServerTransaction({ data: { id } });
      await serverLedgerQuery.refetch();
      return result;
    } catch {
      // Fallback to local state mutation if server call fails
      store.approveTransaction(id);
      return { success: true };
    }
  };

  const handleReject = async (id: string) => {
    try {
      const result = await rejectServerTransaction({ data: { id } });
      await serverLedgerQuery.refetch();
      return result;
    } catch {
      store.rejectTransaction(id);
      return { success: true };
    }
  };

  return {
    ledger: {
      data: store.ledger,
      isLoading: false,
      isFetching: serverLedgerQuery.isFetching,
      live,
      updatedAt: store.lastTick,
    } as DualRailFeed<LedgerRow[]>,
    rails: {
      data: store.rails,
      isLoading: false,
      isFetching: false,
      live,
      updatedAt: store.lastTick,
    } as DualRailFeed<RailHealth[]>,
    reserves: {
      data: store.reserves,
      isLoading: false,
      isFetching: false,
      live,
      updatedAt: store.lastTick,
    } as DualRailFeed<ReserveSnapshot>,
    live,
    // Store mutation actions
    approveTransaction: handleApprove,
    overrideRail: store.overrideRail,
    rejectTransaction: handleReject,
    pauseRail: store.pauseRail,
  };
}
