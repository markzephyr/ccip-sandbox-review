# CCIP Bridge Engine & Dual-Rail Settlement Ledger (v1.0.0)

[![Chainlink Sepolia Testnet](https://img.shields.io/badge/Chainlink_Sepolia-Live_Feed-0847F7?style=flat-square&logo=chainlink)](https://sepolia.etherscan.io/address/0x694AA1769357215DE4FAC081bf1f309aDC325306)
[![Version](https://img.shields.io/badge/Version-1.0.0-00B171?style=flat-square)](./package.json)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](./LICENSE)

An institutional multi-chain settlement sandbox and dual-rail liquidity engine connecting traditional fiat banking rails (FAST, BI-FAST, SEPA) with EVM and non-EVM blockchain networks (Ethereum, Polygon, Avalanche, Hedera, Zilliqa).

---

## ⚡ Real On-Chain Chainlink CCIP 2.0 & Oracle Integration

The codebase features production-grade on-chain Chainlink integrations wired directly to testnet infrastructure:

### 1. Chainlink CCIP 2.0 & CRE (Chainlink Runtime Environment)
* **Official Packages:** `@chainlink/contracts-ccip` and `@chainlink/local` installed.
* **On-Chain Router Contracts:** Direct `viem` RPC querying on Sepolia (`0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59`) and Arbitrum Sepolia (`0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165`).
* **Lanes & Message Verification:** Dynamic querying of `IRouterClient.isChainSupported()`, `getOffRamps()`, and destination `ExecutionStateChanged` log events.
* **CRE Workflow Triggers:** Traditional banking API triggers (FAST, BI-FAST, PayNow) mapped to CRE consensus triggers (`CRE::FAST_SG_TRIGGER`, `CRE::BIFAST_ID_TRIGGER`, `CRE::PAYNOW_SG_TRIGGER`) triggering CCIP on-chain execution.
* **Solidity Smart Contracts:**
  * `contracts/CCIPCrossChainSender.sol`: Implements `IRouterClient` and `Client.EVM2AnyMessage` for cross-chain message sending with LINK or native fee tokens.
  * `contracts/CCIPCrossChainReceiver.sol`: Implements `CCIPReceiver` and `_ccipReceive` for handling inbound cross-chain settlement messages.

### 2. Live Chainlink Sepolia Price Feed
* **Contract Address:** [`0x694AA1769357215DE4FAC081bf1f309aDC325306`](https://sepolia.etherscan.io/address/0x694AA1769357215DE4FAC081bf1f309aDC325306)
* **Interface:** `AggregatorV3Interface.latestRoundData()`
* **Feed:** ETH / USD
* **Client:** `viem` public JSON-RPC provider polling live testnet state with fallback RPCs.

---

## 🏛️ Core Architecture & Features

### 1. Dual-Rail Transaction Ledger
* Real-time monitoring of settlement across fiat payment rails and public blockchains.
* Live FX rate locks with dynamic lock timers and network gas estimators.
* Interactive state machine: operator approval, rejection, and dynamic rail override rerouting.

### 2. Multi-Chain Settlement & Acquisition Topology
* Visual telemetry of transaction flow between traditional clearing nodes (`Institution-Node-01`, `Partner Bank (SG)`, `Corporate Rail (EUR)`) and EVM chains.
* Rail latency, uptime percentages, and throughput tracking.

### 3. Proof of Reserve & Collateral Attestation
* Real-time collateralization monitoring comparing off-chain safeguarded balances with on-chain circulating token supplies (e.g., XSGD, USDC, BIDR).
* Visual 1:1 asset matching delta and historical collateralization trends.

### 4. Interactive Developer Canvas & Cloud API Docs
* REST endpoint schemas, webhook payloads, and SDK code examples for integrating the CCIP settlement engine into banking cores.

---

## 🛠️ Tech Stack

* **Framework:** [TanStack Start](https://tanstack.com/start) with TanStack Router & React Query
* **Web3 / RPC:** [viem](https://viem.sh/) connected to Chainlink Oracles on Ethereum Sepolia
* **Runtime / Language:** React 19, TypeScript 5.8
* **Styling & UI:** Tailwind CSS, Radix UI primitives, Lucide Icons, Sonner toasts
* **Data Visualization:** Recharts

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ or Bun
* npm, pnpm, or bun

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/markzephyr/chainlink.git
cd chainlink

# Install dependencies (including viem for on-chain calls)
npm install

# Run the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The dashboard will immediately establish an RPC connection to Ethereum Sepolia to display the live Chainlink feed.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🔒 Institutional Disclaimer

This project is an open-source settlement architecture reference implementation. Institutional partner names (e.g., `Institution-Node-01`, `Partner Bank`) are representative sandbox entities designed to showcase dual-rail interoperability without implying commercial endorsement.
