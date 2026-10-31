# CCIP Bridge Engine & Dual-Rail Settlement Ledger (v1.0.0)

![Chainlink](https://img.shields.io/badge/Chainlink-Sepolia_Testnet-375BD2)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-All_Rights_Reserved-red)

A settlement sandbox that visualizes dual-rail flows between traditional fiat banking rails (FAST, BI-FAST) and public blockchains (Ethereum, Polygon, Avalanche, Hedera, Zilliqa). Built as a presentation tool for explaining cross-chain settlement (CCIP) to banking and institutional clients.

> **Live vs. simulated:** The ETH/USD price feed is live on-chain data from Chainlink on Ethereum Sepolia. All fiat rails, ledger entries, rail health metrics, and reserve data are simulated.

**Live demo:** https://chainlink-umber.vercel.app

---

## Live On-Chain Chainlink Integration

The dashboard reads a real Chainlink data feed on Ethereum Sepolia testnet:

- **Contract address:** `0x694AA1769357215DE4FAC081bf1f309aDC325306`
- **Interface:** `AggregatorV3Interface.latestRoundData()`
- **Feed:** ETH / USD
- **Client:** `viem` public JSON-RPC provider polling live testnet state
- **Telemetry shown:** live on-chain price, round ID, oracle block time, manual RPC refresh, and an on-chain payload inspector

```ts
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

## Features

### 1. Dual-Rail Ledger
Simulated settlement monitoring across fiat payment rails and public blockchains.
- Status tracking (settled, pending, processing, failed)
- Search and filters by status, currency, and rail
- Operator approval actions on pending transactions

### 2. Rail & Network Health
Simulated telemetry for bank rails and blockchain networks.
- Latency, uptime, and 24h throughput per rail
- Incident history and operational status
- Pause and resume controls per rail

### 3. Reserve Attestation (Simulated)
Demonstrates how off-chain reserves could be compared with on-chain circulating supply.
- Collateralization ratio and historical trend chart
- 1:1 asset matching view
- Attestation panel with placeholder auditor, report hash, and findings

> All attestation data is clearly labeled as simulated. No real audit, auditor, or reserve exists.

### 4. Developer Canvas
Reference API contracts for plugging the UI into a real backend.
- Typed payload contracts (`LedgerRow`, `RailHealth`, `ReserveSnapshot`)
- Endpoint schemas: `GET /api/ledger`, `GET /api/rails/health`, `GET /api/treasury/reserves`

---

## Tech Stack

- **Framework:** TanStack Start with TanStack Router and React Query
- **Web3 / RPC:** viem, connected to Chainlink oracles on Ethereum Sepolia
- **Language / Runtime:** React 19, TypeScript 5.8
- **Styling / UI:** Tailwind CSS, Radix UI primitives, Lucide Icons, Sonner toasts
- **Charts:** Recharts

---

## Getting Started

*Repository access is by invitation only.*

**Prerequisites:** Node.js 18+ or Bun, and npm, pnpm, or bun.

```bash
# Clone the repository (requires invited access)
git clone https://github.com/markzephyr/chainlink.git
cd chainlink

# Install dependencies
npm install

# Run the local development server
npm run dev
```

Open http://localhost:3000. The dashboard connects to Ethereum Sepolia and displays the live Chainlink feed.

**Production build**

```bash
npm run build
npm run preview
```

---

## License

Copyright (c) 2026 Mark Zephyr. All rights reserved.

This repository is shared for evaluation only. No copying, modification, use, or distribution is permitted without prior written permission from the author.

## Disclaimer

This project is a proprietary settlement architecture reference implementation. Institutional partner names (e.g., Institution-Node-01, Partner Bank) are representative sandbox entities and do not imply commercial endorsement or affiliation with any bank, Chainlink Labs, or the Chainlink Foundation. It is not affiliated with or endorsed by Chainlink Labs or the Chainlink Foundation.

## Contact

Mark Zephyr | markzephyr07@gmail.com
