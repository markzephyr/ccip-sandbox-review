# CCIP Bridge Engine & Dual-Rail Settlement Ledger (v1.0.0)

[![Chainlink Sepolia Testnet](https://img.shields.io/badge/Chainlink_Sepolia-Live_Feed-0847F7?style=flat-square&logo=chainlink)](https://sepolia.etherscan.io/address/0x694AA1769357215DE4FAC081bf1f309aDC325306)
[![Version](https://img.shields.io/badge/Version-1.0.0-00B171?style=flat-square)](./package.json)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](./LICENSE)

An institutional multi-chain settlement sandbox and dual-rail liquidity engine connecting traditional fiat banking rails (FAST, BI-FAST, SEPA) with EVM and non-EVM blockchain networks (Ethereum, Polygon, Avalanche, Hedera, Zilliqa).

---

## ⚡ Real On-Chain Chainlink Integration

Unlike purely static design mockups, **v1.0.0 features a real live on-chain Chainlink integration** wired directly to Ethereum Sepolia testnet:

* **Contract Address:** [`0x694AA1769357215DE4FAC081bf1f309aDC325306`](https://sepolia.etherscan.io/address/0x694AA1769357215DE4FAC081bf1f309aDC325306)
* **Interface:** `AggregatorV3Interface.latestRoundData()`
* **Feed:** ETH / USD
* **Client:** `viem` public JSON-RPC provider polling live testnet state
* **Dashboard Telemetry:** Displays live on-chain price, round ID, block timestamp, and single-click RPC refresh with direct Sepolia Etherscan verification.

```typescript
// src/hooks/useChainlinkFeed.ts
const [roundData, decimals, description] = await Promise.all([
  client.readContract({
    address: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    abi: AGGREGATOR_ABI,
    functionName: "latestRoundData",
  }),
  // ...
]);
```

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
