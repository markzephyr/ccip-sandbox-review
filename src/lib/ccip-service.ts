/**
 * CCIP On-Chain Service — Live reads from deployed CCIP Router, OnRamp,
 * and OffRamp contracts on Sepolia and Arbitrum Sepolia testnets.
 *
 * This module replaces the previous mock/simulated CCIP logic with
 * REAL on-chain contract calls via viem, following the same pattern
 * as the existing Chainlink ETH/USD price feed integration.
 *
 * Architecture (CCIP 2.0 / CRE):
 *   Source Chain Router → OnRamp → ARM Blessing → CommitStore → OffRamp → Destination
 */

import type { PublicClient } from "viem";
import {
  CCIP_CHAINS,
  CCIP_CHAIN_SELECTORS,
  CHAIN_SELECTOR_LABELS,
  ROUTER_ABI,
  OFFRAMP_ABI,
  EXECUTION_STATES,
  type ExecutionState,
} from "./ccip-config";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface CCIPSupportedLane {
  sourceChain: string;
  destChain: string;
  destChainSelector: string;
  isSupported: boolean;
  onRampAddress: string;
}

export interface CCIPOffRampInfo {
  sourceChainSelector: string;
  sourceChainName: string;
  offRampAddress: string;
}

export interface CCIPRouterState {
  chainName: string;
  routerAddress: string;
  supportedLanes: CCIPSupportedLane[];
  offRamps: CCIPOffRampInfo[];
  queriedAt: Date;
}

export interface CCIPMessageEvent {
  messageId: string;
  sequenceNumber: string;
  state: ExecutionState;
  stateCode: number;
  offRampAddress: string;
  sourceChain: string;
  destChain: string;
  blockNumber: string;
  transactionHash: string;
  explorerUrl: string;
  ccipExplorerUrl: string;
  timestamp: Date;
}

/* ------------------------------------------------------------------ */
/* Router Queries — Read live CCIP infrastructure configuration        */
/* ------------------------------------------------------------------ */

/**
 * Query a CCIP Router contract to discover supported lanes and infrastructure.
 * Makes REAL on-chain view calls to the deployed Router contract.
 */
export async function queryCCIPRouter(
  chainKey: keyof typeof CCIP_CHAINS,
): Promise<CCIPRouterState> {
  const config = CCIP_CHAINS[chainKey];
  if (!config) throw new Error(`Unknown CCIP chain: ${chainKey}`);

  const { client, routerAddress, name: chainName } = config;

  // Query chain support for all known destination selectors
  const destSelectors = Object.entries(CCIP_CHAIN_SELECTORS).filter(
    ([, selector]) => selector !== config.chainSelector,
  );

  const supportChecks = await Promise.allSettled(
    destSelectors.map(async ([label, selector]) => {
      const isSupported = await (client as PublicClient).readContract({
        address: routerAddress,
        abi: ROUTER_ABI,
        functionName: "isChainSupported",
        args: [selector],
      });

      let onRampAddress = "0x0000000000000000000000000000000000000000";
      if (isSupported) {
        try {
          onRampAddress = (await (client as PublicClient).readContract({
            address: routerAddress,
            abi: ROUTER_ABI,
            functionName: "getOnRamp",
            args: [selector],
          })) as string;
        } catch {
          // OnRamp query may fail for unsupported destinations
        }
      }

      return {
        sourceChain: chainName,
        destChain: CHAIN_SELECTOR_LABELS[selector.toString()] ?? label,
        destChainSelector: selector.toString(),
        isSupported: isSupported as boolean,
        onRampAddress,
      } satisfies CCIPSupportedLane;
    }),
  );

  const supportedLanes = supportChecks
    .filter((r): r is PromiseFulfilledResult<CCIPSupportedLane> => r.status === "fulfilled")
    .map((r) => r.value);

  // Query OffRamp registry
  let offRamps: CCIPOffRampInfo[] = [];
  try {
    const rawOffRamps = (await (client as PublicClient).readContract({
      address: routerAddress,
      abi: ROUTER_ABI,
      functionName: "getOffRamps",
    })) as readonly { sourceChainSelector: bigint; offRamp: string }[];

    offRamps = rawOffRamps.map((or) => ({
      sourceChainSelector: or.sourceChainSelector.toString(),
      sourceChainName:
        CHAIN_SELECTOR_LABELS[or.sourceChainSelector.toString()] ??
        `Chain ${or.sourceChainSelector.toString().slice(0, 8)}...`,
      offRampAddress: or.offRamp,
    }));
  } catch {
    // OffRamp query may not be available on all Router versions
  }

  return {
    chainName,
    routerAddress,
    supportedLanes,
    offRamps,
    queriedAt: new Date(),
  };
}

/* ------------------------------------------------------------------ */
/* OffRamp Event Queries — Read real cross-chain message execution      */
/* ------------------------------------------------------------------ */

/**
 * Query OffRamp contracts on a destination chain for recent
 * ExecutionStateChanged events — these represent real CCIP messages
 * that have been received and processed on the destination chain.
 *
 * This is a REAL on-chain read, not simulated data.
 */
export async function queryRecentCCIPMessages(
  destChainKey: keyof typeof CCIP_CHAINS,
  blockRange = 3000n,
): Promise<CCIPMessageEvent[]> {
  const destConfig = CCIP_CHAINS[destChainKey];
  if (!destConfig) throw new Error(`Unknown CCIP chain: ${destChainKey}`);

  const { client } = destConfig;

  // First, get the OffRamp addresses from the Router
  let offRamps: CCIPOffRampInfo[] = [];
  try {
    const rawOffRamps = (await (client as PublicClient).readContract({
      address: destConfig.routerAddress,
      abi: ROUTER_ABI,
      functionName: "getOffRamps",
    })) as readonly { sourceChainSelector: bigint; offRamp: string }[];

    offRamps = rawOffRamps.map((or) => ({
      sourceChainSelector: or.sourceChainSelector.toString(),
      sourceChainName:
        CHAIN_SELECTOR_LABELS[or.sourceChainSelector.toString()] ??
        `Chain ${or.sourceChainSelector.toString().slice(0, 8)}...`,
      offRampAddress: or.offRamp,
    }));
  } catch {
    return [];
  }

  if (offRamps.length === 0) return [];

  // Get current block number
  const currentBlock = await (client as PublicClient).getBlockNumber();
  const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : 0n;

  // Query ExecutionStateChanged events from each OffRamp
  const allMessages: CCIPMessageEvent[] = [];

  for (const offRamp of offRamps) {
    try {
      const logs = await (client as PublicClient).getLogs({
        address: offRamp.offRampAddress as `0x${string}`,
        event: OFFRAMP_ABI[0],
        fromBlock,
        toBlock: currentBlock,
      });

      for (const log of logs) {
        const stateCode = Number(log.args.state ?? 0);
        const messageId = log.args.messageId as string;

        allMessages.push({
          messageId,
          sequenceNumber: (log.args.sequenceNumber ?? 0n).toString(),
          state: EXECUTION_STATES[stateCode as keyof typeof EXECUTION_STATES] ?? "Untouched",
          stateCode,
          offRampAddress: offRamp.offRampAddress,
          sourceChain: offRamp.sourceChainName,
          destChain: destConfig.name,
          blockNumber: (log.blockNumber ?? 0n).toString(),
          transactionHash: log.transactionHash ?? "0x",
          explorerUrl: `${destConfig.explorerUrl}/tx/${log.transactionHash}`,
          ccipExplorerUrl: `https://ccip.chain.link/msg/${messageId}`,
          timestamp: new Date(), // Block timestamp would require additional RPC call
        });
      }
    } catch {
      // Individual OffRamp query failure is non-fatal
      continue;
    }
  }

  // Sort by block number descending (most recent first)
  allMessages.sort((a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)));

  return allMessages;
}

/* ------------------------------------------------------------------ */
/* Aggregate Queries                                                   */
/* ------------------------------------------------------------------ */

export interface CCIPNetworkOverview {
  routers: CCIPRouterState[];
  recentMessages: CCIPMessageEvent[];
  totalSupportedLanes: number;
  totalOffRamps: number;
  queriedAt: Date;
}

/**
 * Query all configured CCIP chains for a comprehensive network overview.
 * Returns router states, supported lanes, OffRamp info, and recent messages.
 */
export async function queryCCIPNetworkOverview(): Promise<CCIPNetworkOverview> {
  const chainKeys = Object.keys(CCIP_CHAINS) as (keyof typeof CCIP_CHAINS)[];

  // Query all routers in parallel
  const routerResults = await Promise.allSettled(chainKeys.map((key) => queryCCIPRouter(key)));
  const routers = routerResults
    .filter((r): r is PromiseFulfilledResult<CCIPRouterState> => r.status === "fulfilled")
    .map((r) => r.value);

  // Query recent messages from all destination chains
  const messageResults = await Promise.allSettled(
    chainKeys.map((key) => queryRecentCCIPMessages(key, 2000n)),
  );
  const recentMessages = messageResults
    .filter((r): r is PromiseFulfilledResult<CCIPMessageEvent[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .sort((a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)))
    .slice(0, 50); // Keep latest 50

  const totalSupportedLanes = routers.reduce(
    (sum, r) => sum + r.supportedLanes.filter((l) => l.isSupported).length,
    0,
  );
  const totalOffRamps = routers.reduce((sum, r) => sum + r.offRamps.length, 0);

  return {
    routers,
    recentMessages,
    totalSupportedLanes,
    totalOffRamps,
    queriedAt: new Date(),
  };
}
