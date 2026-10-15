import { useEffect, useState } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { sepolia } from "viem/chains";

/**
 * Live Chainlink Price Feed hook — reads ETH/USD from the Chainlink
 * Aggregator contract on Sepolia testnet via a public RPC.
 *
 * Contract: Chainlink ETH/USD Price Feed on Sepolia
 * Address:  0x694AA1769357215DE4FAC081bf1f309aDC325306
 * ABI:      AggregatorV3Interface.latestRoundData()
 *
 * This is a REAL on-chain call, not simulated data.
 */

const FEED_ADDRESS = "0x694AA1769357215DE4FAC081bf1f309aDC325306" as const;

// Minimal ABI for AggregatorV3Interface — only latestRoundData + decimals
const AGGREGATOR_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const client = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

export interface ChainlinkFeedData {
  /** Human-readable price, e.g. "3421.12" */
  price: string;
  /** Feed pair label from on-chain, e.g. "ETH / USD" */
  pair: string;
  /** When the feed was last updated on-chain (Date object) */
  updatedAt: Date;
  /** The Aggregator round ID */
  roundId: string;
  /** Number of decimals used */
  decimals: number;
}

export interface UseChainlinkFeedResult {
  data: ChainlinkFeedData | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;
  refetch: () => void;
}

const REFETCH_INTERVAL_MS = 30_000; // poll every 30s

export function useChainlinkFeed(): UseChainlinkFeedResult {
  const [data, setData] = useState<ChainlinkFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function fetchFeed() {
      try {
        setIsLoading(true);
        setError(null);

        const [roundData, decimals, description] = await Promise.all([
          client.readContract({
            address: FEED_ADDRESS,
            abi: AGGREGATOR_ABI,
            functionName: "latestRoundData",
          }),
          client.readContract({
            address: FEED_ADDRESS,
            abi: AGGREGATOR_ABI,
            functionName: "decimals",
          }),
          client.readContract({
            address: FEED_ADDRESS,
            abi: AGGREGATOR_ABI,
            functionName: "description",
          }),
        ]);

        if (cancelled) return;

        const [roundId, answer, , updatedAt] = roundData;
        const price = formatUnits(answer, decimals);

        setData({
          price: Number(price).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          pair: description,
          updatedAt: new Date(Number(updatedAt) * 1000),
          roundId: roundId.toString(),
          decimals,
        });
        setLastFetchedAt(new Date());
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to fetch Chainlink feed");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchFeed();

    const interval = setInterval(fetchFeed, REFETCH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tick]);

  return { data, isLoading, error, lastFetchedAt, refetch };
}
