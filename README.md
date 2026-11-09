# CCIP 2.0 Bridge Engine & Dual-Rail Settlement Sandbox

[![Chainlink CCIP](https://img.shields.io/badge/Chainlink_CCIP-v2.0-375BD2?style=flat-square&logo=chainlink)](https://ccip.chain.link)
[![Chainlink Sepolia Testnet](https://img.shields.io/badge/Chainlink_Sepolia-Live_Feed-0847F7?style=flat-square&logo=chainlink)](https://sepolia.etherscan.io/address/0x694AA1769357215DE4FAC081bf1f309aDC325306)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](./LICENSE)

An institutional cross-chain settlement sandbox and dual-rail liquidity engine connecting traditional fiat banking clearing rails (**FAST**, **BI-FAST**, **PayNow**) with EVM testnets via **Chainlink CCIP 2.0** and the **Chainlink Runtime Environment (CRE)**.

---

## ⚡ Real On-Chain Chainlink CCIP 2.0 & Oracle Integration

The sandbox connects directly to deployed Chainlink infrastructure across Ethereum Sepolia and Arbitrum Sepolia testnets without simulated timeouts:

### 1. Chainlink CCIP 2.0 & CRE (Chainlink Runtime Environment)

- **Official Packages Installed:**
  - `@chainlink/contracts-ccip` (`^1.5.0`): Official CCIP interfaces, `IRouterClient`, and `Client.EVM2AnyMessage` payload structures.
  - `@chainlink/local` (`^0.2.1`): Local test harness and Chainlink mock tooling.
- **On-Chain Router Contracts Queried via RPC:**
  - **Ethereum Sepolia Router:** [`0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59`](https://sepolia.etherscan.io/address/0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59)
  - **Arbitrum Sepolia Router:** [`0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165`](https://sepolia.arbiscan.io/address/0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165)
- **Active Lane Verification:** Live `viem` contract calls to `IRouterClient.isChainSupported()` verifying routes to Arbitrum Sepolia (`3478487238524512106`), Optimism Sepolia (`5224473277236331295`), Avalanche Fuji (`14767482510784806043`), Base Sepolia (`10344971235874465080`), and Polygon Amoy (`16281711391670634445`).
- **OnRamp & OffRamp Resolution:** Live resolution of deployed OnRamps (e.g. `0x8dcf17f298c881A547D91ca4aA3C2AD7568C6777` for Sepolia &rarr; Arbitrum Sepolia) and registered OffRamps via `getOffRamps()`.
- **CRE Workflow Triggers (Web2 Banking &rarr; CCIP):**
  - Traditional Web2 banking clearing triggers are mapped directly to institutional CRE consensus events:
    - `CRE::FAST_SG_TRIGGER` (Singapore FAST / MAS)
    - `CRE::BIFAST_ID_TRIGGER` (Indonesia BI-FAST / Bank Indonesia)
    - `CRE::PAYNOW_SG_TRIGGER` (Singapore PayNow Corporate)
  - Each ledger row links directly to verified on-chain message hashes on the [Chainlink CCIP Explorer](https://ccip.chain.link).

### 2. Production Solidity Smart Contracts

Located in [`contracts/`](./contracts/):

- **`CCIPCrossChainSender.sol`**:
  - Implements `IRouterClient` and `Client.EVM2AnyMessage`.
  - Verifies destination chain support via `isChainSupported()`.
  - Handles dynamic fee calculation and cross-chain execution with either native gas or LINK tokens.
- **`CCIPCrossChainReceiver.sol`**:
  - Inherits from `CCIPReceiver`.
  - Decodes inbound cross-chain settlement payloads (`_ccipReceive`) and maintains audited on-chain settlement state.

### 3. Live Chainlink Sepolia Price Feed

- **Contract Address:** [`0x694AA1769357215DE4FAC081bf1f309aDC325306`](https://sepolia.etherscan.io/address/0x694AA1769357215DE4FAC081bf1f309aDC325306)
- **Interface:** `AggregatorV3Interface.latestRoundData()`
- **Feed:** ETH / USD
- **Client:** `viem` resilient multi-RPC fallback transport polling live testnet state with an interactive Solidity tuple inspector.

---

## 🏛️ Application Architecture & Navigation

- **`/` (Dual-Rail Ledger):** Real-time monitoring of settlement across fiat payment rails and public blockchains with CRE Workflow Trigger tags and live Chainlink oracle telemetry.
- **`/ccip` (CCIP 2.0 / CRE Explorer):** Live lane connectivity matrix, registered OffRamp monitor, CRE-to-CCIP pipeline diagram, and on-chain log listeners.
- **`/rails` (Rail & Acquisition Map):** Latency, uptime, and throughput grid across fiat clearing nodes and blockchain networks.
- **`/reserves` (Reserve Attestation):** Proof of Reserve (PoR) 1:1 collateralization breakdown comparing off-chain safeguarded balances with on-chain token supply.
- **`/developer` (Developer Canvas):** Payload specifications and TypeScript snippets for consuming the unified dual-rail and CCIP hooks.

---

## 🛠️ Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) with TanStack Router & React Query
- **Smart Contracts / Interoperability:** `@chainlink/contracts-ccip`, `@chainlink/local`, Solidity `^0.8.20`
- **Web3 / RPC:** [viem](https://viem.sh/) connected to Ethereum Sepolia and Arbitrum Sepolia
- **Runtime / Language:** React 19, TypeScript 5.8
- **Styling & UI:** Tailwind CSS, Radix UI primitives, Lucide Icons, Sonner toasts
- **Data Visualization:** Recharts

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, pnpm, or bun

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/markzephyr/ccip-sandbox-review.git
cd ccip-sandbox-review

# Install dependencies (including official @chainlink packages)
npm install

# Run the local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The application will establish live RPC connections to Sepolia and Arbitrum Sepolia.

### Production Build

```bash
npm run build
```

---

## 🔒 Institutional Disclaimer

This project is an open-source settlement architecture reference implementation. Institutional partner names (e.g., `Institution-Node-01`, `Partner Bank`) are representative sandbox entities designed to showcase dual-rail interoperability without implying commercial endorsement.
