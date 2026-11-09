/**
 * CCIP 2.0 / CRE Configuration — Live on-chain contract addresses, chain selectors,
 * and ABI fragments for Chainlink CCIP Router, OnRamp, and OffRamp contracts.
 *
 * All addresses are real deployed contracts on Ethereum Sepolia and Arbitrum Sepolia testnets.
 * ABIs sourced from @chainlink/contracts-ccip IRouterClient, IOnRamp, IOffRamp interfaces.
 *
 * Architecture:
 *   CRE Workflow Trigger (FAST/BI-FAST/PayNow) → CCIP Router → OnRamp → ARM → OffRamp → Destination
 */

import { createPublicClient, fallback, http, type PublicClient, type Chain } from "viem";
import { sepolia, arbitrumSepolia } from "viem/chains";

/* ------------------------------------------------------------------ */
/* Chain Selectors (CCIP-specific uint64 identifiers)                  */
/* ------------------------------------------------------------------ */

export const CCIP_CHAIN_SELECTORS = {
  ETHEREUM_SEPOLIA: 16015286601757825753n,
  ARBITRUM_SEPOLIA: 3478487238524512106n,
  OPTIMISM_SEPOLIA: 5224473277236331295n,
  AVALANCHE_FUJI: 14767482510784806043n,
  BASE_SEPOLIA: 10344971235874465080n,
  POLYGON_AMOY: 16281711391670634445n,
} as const;

export const CHAIN_SELECTOR_LABELS: Record<string, string> = {
  "16015286601757825753": "Ethereum Sepolia",
  "3478487238524512106": "Arbitrum Sepolia",
  "5224473277236331295": "Optimism Sepolia",
  "14767482510784806043": "Avalanche Fuji",
  "10344971235874465080": "Base Sepolia",
  "16281711391670634445": "Polygon Amoy",
};

/* ------------------------------------------------------------------ */
/* CCIP Router Addresses (deployed contracts)                          */
/* ------------------------------------------------------------------ */

export const CCIP_ROUTERS = {
  SEPOLIA: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59" as const,
  ARBITRUM_SEPOLIA: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165" as const,
};

export const LINK_TOKENS = {
  SEPOLIA: "0x779877A7B0D9E8603169DdbD7836e478b4624789" as const,
  ARBITRUM_SEPOLIA: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E" as const,
};

/* ------------------------------------------------------------------ */
/* ABI Fragments — from @chainlink/contracts-ccip interfaces           */
/* ------------------------------------------------------------------ */

/**
 * IRouterClient — CCIP Router interface for querying chain support,
 * OnRamp addresses, OffRamp configuration, and fee estimation.
 */
export const ROUTER_ABI = [
  {
    inputs: [{ name: "chainSelector", type: "uint64" }],
    name: "isChainSupported",
    outputs: [{ name: "supported", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "destChainSelector", type: "uint64" }],
    name: "getOnRamp",
    outputs: [{ name: "onRampAddress", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getOffRamps",
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "sourceChainSelector", type: "uint64" },
          { name: "offRamp", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "destChainSelector", type: "uint64" }],
    name: "getSupportedTokens",
    outputs: [{ name: "tokens", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * OffRamp ExecutionStateChanged event — emitted when a cross-chain message
 * transitions through execution states on the destination chain.
 *
 * States: 0 = Untouched, 1 = InFlight, 2 = Success, 3 = Failure
 */
export const OFFRAMP_ABI = [
  {
    inputs: [
      { indexed: true, name: "sequenceNumber", type: "uint64" },
      { indexed: true, name: "messageId", type: "bytes32" },
      { indexed: false, name: "state", type: "uint8" },
      { indexed: false, name: "returnData", type: "bytes" },
    ],
    name: "ExecutionStateChanged",
    type: "event",
  },
] as const;

/**
 * OnRamp CCIPSendRequested event — emitted when a cross-chain message
 * is sent from the source chain via the CCIP Router.
 */
export const ONRAMP_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: "message",
        type: "tuple",
        components: [
          { name: "sourceChainSelector", type: "uint64" },
          { name: "sender", type: "address" },
          { name: "receiver", type: "address" },
          { name: "sequenceNumber", type: "uint64" },
          { name: "gasLimit", type: "uint256" },
          { name: "strict", type: "bool" },
          { name: "nonce", type: "uint64" },
          { name: "feeToken", type: "address" },
          { name: "feeTokenAmount", type: "uint256" },
          { name: "data", type: "bytes" },
          {
            name: "tokenAmounts",
            type: "tuple[]",
            components: [
              { name: "token", type: "address" },
              { name: "amount", type: "uint256" },
            ],
          },
          { name: "sourceTokenData", type: "bytes[]" },
          { name: "messageId", type: "bytes32" },
        ],
      },
    ],
    name: "CCIPSendRequested",
    type: "event",
  },
] as const;

/* ------------------------------------------------------------------ */
/* CCIP Execution States                                               */
/* ------------------------------------------------------------------ */

export const EXECUTION_STATES = {
  0: "Untouched",
  1: "InFlight",
  2: "Success",
  3: "Failure",
} as const;

export type ExecutionState = (typeof EXECUTION_STATES)[keyof typeof EXECUTION_STATES];

/* ------------------------------------------------------------------ */
/* CRE (Chainlink Runtime Environment) Workflow Trigger Mapping        */
/* ------------------------------------------------------------------ */

/**
 * Maps traditional banking rails to CRE Workflow Triggers.
 * These represent how Web2 banking API calls trigger CCIP on-chain execution.
 *
 * CRE Architecture:
 *   PayNow/FAST/BI-FAST API Webhook → CRE Workflow Trigger → Chainlink Node
 *   → CCIP Router.ccipSend() → OnRamp → ARM Verification → OffRamp → Settlement
 */
export const CRE_WORKFLOW_TRIGGERS: Record<
  string,
  { trigger: string; protocol: string; region: string }
> = {
  FAST: {
    trigger: "CRE::FAST_SG_TRIGGER",
    protocol: "Singapore FAST (MAS)",
    region: "APAC",
  },
  "BI-FAST": {
    trigger: "CRE::BIFAST_ID_TRIGGER",
    protocol: "Indonesia BI-FAST (Bank Indonesia)",
    region: "APAC",
  },
  PayNow: {
    trigger: "CRE::PAYNOW_SG_TRIGGER",
    protocol: "Singapore PayNow Corporate (ABS)",
    region: "APAC",
  },
};

/* ------------------------------------------------------------------ */
/* CCIP Explorer                                                       */
/* ------------------------------------------------------------------ */

export const CCIP_EXPLORER_BASE = "https://ccip.chain.link";

export function getCCIPExplorerUrl(messageId: string): string {
  return `${CCIP_EXPLORER_BASE}/msg/${messageId}`;
}

/* ------------------------------------------------------------------ */
/* Multi-chain viem clients with resilient fallback RPCs               */
/* ------------------------------------------------------------------ */

export interface CCIPChainConfig {
  chain: Chain;
  name: string;
  routerAddress: `0x${string}`;
  linkTokenAddress: `0x${string}`;
  chainSelector: bigint;
  explorerUrl: string;
  client: PublicClient;
}

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    http("https://ethereum-sepolia-rpc.publicnode.com"),
    http("https://rpc.sepolia.org"),
    http("https://1rpc.io/sepolia"),
    http("https://sepolia.drpc.org"),
  ]),
});

const arbitrumSepoliaClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: fallback([
    http("https://arbitrum-sepolia-rpc.publicnode.com"),
    http("https://sepolia-rollup.arbitrum.io/rpc"),
    http("https://arb-sepolia.g.alchemy.com/v2/demo"),
  ]),
});

export const CCIP_CHAINS: Record<string, CCIPChainConfig> = {
  SEPOLIA: {
    chain: sepolia,
    name: "Ethereum Sepolia",
    routerAddress: CCIP_ROUTERS.SEPOLIA,
    linkTokenAddress: LINK_TOKENS.SEPOLIA,
    chainSelector: CCIP_CHAIN_SELECTORS.ETHEREUM_SEPOLIA,
    explorerUrl: "https://sepolia.etherscan.io",
    client: sepoliaClient as PublicClient,
  },
  ARBITRUM_SEPOLIA: {
    chain: arbitrumSepolia,
    name: "Arbitrum Sepolia",
    routerAddress: CCIP_ROUTERS.ARBITRUM_SEPOLIA,
    linkTokenAddress: LINK_TOKENS.ARBITRUM_SEPOLIA,
    chainSelector: CCIP_CHAIN_SELECTORS.ARBITRUM_SEPOLIA,
    explorerUrl: "https://sepolia.arbiscan.io",
    client: arbitrumSepoliaClient as PublicClient,
  },
};
