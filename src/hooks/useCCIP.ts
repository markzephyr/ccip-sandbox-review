/**
 * React Hook — Live CCIP on-chain data with automatic background polling.
 *
 * Replaces the mock/simulated CCIP state with real-time on-chain reads from:
 * 1. CCIP Router contracts on Sepolia & Arbitrum Sepolia (lane support, OnRamp/OffRamp)
 * 2. CCIP OffRamp contracts (ExecutionStateChanged events)
 *
 * Follows the same pattern as useChainlinkFeed.ts (viem fallback RPCs + polling).
 */

import { useEffect, useState, useCallback } from "react";
import {
  queryCCIPNetworkOverview,
  queryRecentCCIPMessages,
  type CCIPNetworkOverview,
  type CCIPMessageEvent,
} from "@/lib/ccip-service";

export interface UseCCIPResult {
  network: CCIPNetworkOverview | null;
  messages: CCIPMessageEvent[];
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
  lastPolledAt: Date | null;
  secondsAgo: number;
  refetch: () => Promise<void>;
}

const POLL_INTERVAL_SEC = 30; // Poll CCIP contracts every 30 seconds

export function useCCIP(): UseCCIPResult {
  const [network, setNetwork] = useState<CCIPNetworkOverview | null>(null);
  const [messages, setMessages] = useState<CCIPMessageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchCCIPData = useCallback(async () => {
    try {
      setIsPolling(true);
      setError(null);

      const overview = await queryCCIPNetworkOverview();
      setNetwork(overview);
      setMessages(overview.recentMessages);
      setLastPolledAt(new Date());
      setSecondsAgo(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to query CCIP contracts");
    } finally {
      setIsLoading(false);
      setIsPolling(false);
    }
  }, []);

  // 1-second ticker for UI feedback
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial fetch + interval polling
  useEffect(() => {
    let cancelled = false;

    async function initialFetch() {
      if (cancelled) return;
      await fetchCCIPData();
    }

    initialFetch();

    const interval = setInterval(() => {
      if (!cancelled) {
        fetchCCIPData();
      }
    }, POLL_INTERVAL_SEC * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchCCIPData]);

  return {
    network,
    messages,
    isLoading,
    isPolling,
    error,
    lastPolledAt,
    secondsAgo,
    refetch: fetchCCIPData,
  };
}

/**
 * Lighter hook that queries only recent CCIP messages on a specific chain.
 * Useful for widgets that only need message event logs.
 */
export function useCCIPMessages(chainKey: "SEPOLIA" | "ARBITRUM_SEPOLIA" = "ARBITRUM_SEPOLIA") {
  const [messages, setMessages] = useState<CCIPMessageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const msgs = await queryRecentCCIPMessages(chainKey, 2000n);
      setMessages(msgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to query CCIP messages");
    } finally {
      setIsLoading(false);
    }
  }, [chainKey]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 20000); // 20s poll
    return () => clearInterval(interval);
  }, [fetchMessages]);

  return { messages, isLoading, error, refetch: fetchMessages };
}
