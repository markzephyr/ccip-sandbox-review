# CCIP Bridge Engine — Chainlink CCIP 2.0 / CRE Demo

A multi-chain settlement dashboard demonstrating Chainlink's Cross-Chain Interoperability Protocol (CCIP) 2.0 and Chainlink Runtime Environment (CRE) architecture. Built with TanStack Start, React, viem, and Tailwind CSS.

## What's Real (On-Chain)

| Feature                               | Source                                                | Contract / Feed                                                                                                    |
| ------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **CCIP Router Queries**               | Live RPC to Sepolia & Arb Sepolia                     | `0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59` (Sepolia), `0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165` (Arb Sepolia) |
| **Lane Support (`isChainSupported`)** | On-chain view call                                    | CCIP Router                                                                                                        |
| **OnRamp/OffRamp Discovery**          | On-chain view call (`getOnRamp`, `getOffRamps`)       | CCIP Router                                                                                                        |
| **Cross-Chain Message Events**        | On-chain log parsing (`ExecutionStateChanged`)        | OffRamp contracts on destination chains                                                                            |
| **ETH/USD Price Feed**                | Live `latestRoundData()` on Sepolia testnet           | `0x694AA1769357215DE4FAC081bf1f309aDC325306`                                                                       |
| **CCIP Transfer on Approve**          | Real `ccipSend()` via Router (requires funded wallet) | CCIP Router on Sepolia                                                                                             |

## What's Simulated (Seed Data)

| Feature                    | Why                                           | What Would Replace It                          |
| -------------------------- | --------------------------------------------- | ---------------------------------------------- |
| **Ledger Transactions**    | No production banking API connected           | Real bank/exchange API integration             |
| **Rail Health Metrics**    | Latency, uptime, throughput are static values | Real monitoring infrastructure                 |
| **Reserve Balances**       | Custodian balances are fictional              | Real custodial bank API or Chainlink PoR feed  |
| **Attestation Report**     | No real audit engagement exists               | Actual Chainlink PoR attestation               |
| **Historical Trend Chart** | Static 7-point dataset                        | Time-series database with real historical data |
| **Counterparty Names**     | All institution names are fictional           | Real institutional partners                    |

## Enabling Real CCIP Transfers

When you click **Approve** on a pending transaction, the server attempts a real `ccipSend()` on Sepolia. To enable this:

1. Get a Sepolia wallet with testnet ETH and LINK tokens:
   - ETH faucet: https://sepoliafaucet.com
   - LINK faucet: https://faucets.chain.link/sepolia
2. Create a `.env` file from `.env.example`:
   ```bash
   CCIP_PRIVATE_KEY=0xyour_private_key_here
   ```
3. Restart the dev server. Approvals will now trigger real cross-chain messages.

Without the private key, approvals still work in local mode (status changes to SETTLED) but no on-chain transaction is sent.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  TanStack Start (SSR + Server Functions)                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ Server Store  │  │ CCIP Sender  │  │ CCIP Service  │ │
│  │ (Ledger)      │  │ (ccipSend)   │  │ (On-Chain Qry)│ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
├─────────────────────────────────────────────────────────┤
│  React Client                                           │
│  ┌────────┐ ┌──────┐ ┌──────────┐ ┌────────┐ ┌───────┐│
│  │Ledger  │ │CCIP  │ │Rails Map │ │Reserves│ │Dev    ││
│  │  /     │ │/ccip │ │/rails    │ │/reserve│ │/dev   ││
│  └────────┘ └──────┘ └──────────┘ └────────┘ └───────┘│
└─────────────────────────────────────────────────────────┘
         │                    │
    ┌────▼────┐          ┌────▼────┐
    │ Sepolia │          │Arb Sep. │
    │ Router  │◄────────►│ Router  │
    │ OnRamp  │  CCIP    │ OffRamp │
    └─────────┘          └─────────┘
```

## Tech Stack

- **Framework**: TanStack Start v1 (SSR, server functions, file-based routing)
- **On-Chain**: viem v2 (public + wallet clients, contract reads, log parsing)
- **Chainlink**: @chainlink/contracts-ccip v1.5, Chainlink Data Feeds
- **UI**: React 19, Tailwind CSS v4, Radix UI, Recharts, Lucide icons
- **Data**: React Query v5 (polling), Zustand-style external store

## Contracts

- `contracts/CCIPCrossChainSender.sol` — Solidity contract using `IRouterClient.ccipSend()`
- `contracts/CCIPCrossChainReceiver.sol` — Solidity contract extending `CCIPReceiver`

## Development

```bash
npm install
cp .env.example .env     # Optional: add CCIP_PRIVATE_KEY for real transfers
npm run dev               # Start dev server at http://localhost:3000
npm run build             # Production build
```

## Routes

| Route        | Description                                  | Data Source                          |
| ------------ | -------------------------------------------- | ------------------------------------ |
| `/`          | Dual-Rail Ledger with approve/reject actions | Server store (seed data) + CCIP send |
| `/ccip`      | CCIP 2.0 / CRE Explorer (3 tabs)             | **100% on-chain** RPC queries        |
| `/rails`     | Rail & Acquisition Map                       | Seed data (static health metrics)    |
| `/reserves`  | Reserve Attestation                          | Seed data + live Chainlink PoR feed  |
| `/developer` | Developer Canvas (types & snippets)          | Code reference                       |
