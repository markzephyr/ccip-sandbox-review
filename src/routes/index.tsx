import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  ExternalLink,
  Fuel,
  Lock,
  Radio,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { HubShell, formatMoney } from "@/components/hub-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApexDualRail } from "@/hooks/useApexDualRail";
import { useChainlinkFeed } from "@/hooks/useChainlinkFeed";
import type { LedgerRow, LedgerStatus } from "@/lib/apex";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dual-Rail Ledger — CCIP Bridge Engine" },
      {
        name: "description",
        content:
          "Monitor settlement flowing between fiat banking rails and blockchain networks with live FX rate locks and gas costs.",
      },
      { property: "og:title", content: "Dual-Rail Ledger — CCIP Bridge Engine" },
      {
        property: "og:description",
        content: "Institutional console for fiat and stablecoin settlement across dual rails.",
      },
    ],
  }),
  component: LedgerPage,
});

const STATUS_STYLE: Record<LedgerStatus, string> = {
  settled: "bg-[#00B171]/15 text-[#00B171] border-[#00B171]/40",
  pending: "bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/40",
  processing: "bg-[#0847F7]/15 text-[#7DD3FC] border-[#0847F7]/40",
  failed: "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30",
};

const AVAILABLE_RAILS = [
  "Ethereum Sepolia",
  "Arbitrum Sepolia",
  "Avalanche Fuji",
  "Base Sepolia",
  "Polygon Amoy",
  "FAST · Institution-Node-01",
  "FAST · Partner Bank (SG)",
  "FAST · Institution-Node-02",
  "FAST · Partner Bank (HK)",
  "BI-FAST · Corporate Rail (APAC)",
  "BI-FAST · Corporate Rail (EUR)",
];

function LedgerPage() {
  const { ledger, live, approveTransaction, overrideRail, rejectTransaction } =
    useApexDualRail();
  const chainlinkFeed = useChainlinkFeed();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState<boolean>(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [railFilter, setRailFilter] = useState<string>("all");
  const [overrideTargetRail, setOverrideTargetRail] = useState<string>("");

  // Keep active selected row updated with store updates
  const selected = useMemo(() => {
    return ledger.data.find((row) => row.id === selectedId) ?? null;
  }, [ledger.data, selectedId]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return ledger.data.filter((row) => {
      // Status filter
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }
      // Currency filter
      if (currencyFilter !== "all" && row.currency !== currencyFilter) {
        return false;
      }
      // Rail filter
      if (railFilter !== "all") {
        const matchesSource = row.sourceRail.toLowerCase().includes(railFilter.toLowerCase());
        const matchesDest = row.destinationRail.toLowerCase().includes(railFilter.toLowerCase());
        if (!matchesSource && !matchesDest) return false;
      }
      // Text query (network, currency pair, amount, ID, counterparty)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = row.id.toLowerCase().includes(q);
        const matchesCounterparty = row.counterparty.toLowerCase().includes(q);
        const matchesAmount = String(row.amount).includes(q);
        const matchesCurrency = row.currency.toLowerCase().includes(q);
        const matchesSource = row.sourceRail.toLowerCase().includes(q);
        const matchesDest = row.destinationRail.toLowerCase().includes(q);

        if (
          !matchesId &&
          !matchesCounterparty &&
          !matchesAmount &&
          !matchesCurrency &&
          !matchesSource &&
          !matchesDest
        ) {
          return false;
        }
      }
      return true;
    });
  }, [ledger.data, statusFilter, currencyFilter, railFilter, searchQuery]);

  const handleApprove = (txId: string) => {
    approveTransaction(txId);
    toast.success(`Transaction ${txId} Approved`, {
      description: "State transitioned to SETTLED. Reserve matching delta recomputed.",
    });
  };

  const handleOverrideRail = (txId: string) => {
    if (!overrideTargetRail) {
      toast.error("Please choose a target rail first.");
      return;
    }
    overrideRail(txId, overrideTargetRail);
    toast.success(`Rail Override Executed for ${txId}`, {
      description: `Rerouted destination rail to ${overrideTargetRail}. Status moved to PROCESSING.`,
    });
  };

  const handleReject = (txId: string) => {
    rejectTransaction(txId);
    toast.error(`Transaction ${txId} Rejected`, {
      description: "Status mutated to FAILED. Escrow lock released back to source pool.",
    });
  };

  return (
    <HubShell
      title="Dual-Rail Ledger"
      subtitle="Settlement crossing fiat banking and blockchain rails"
      live={live}
      isFetching={ledger.isFetching}
    >
      {/* Real On-Chain Chainlink Testnet Feed Banner */}
      <div
        data-testid="chainlink-oracle-feed"
        data-contract="0x694AA1769357215DE4FAC081bf1f309aDC325306"
        data-round-id={chainlinkFeed.data?.roundId}
        data-raw-answer={chainlinkFeed.data?.rawAnswer}
        data-updated-at={chainlinkFeed.data?.updatedAt?.toISOString()}
        data-started-at={chainlinkFeed.data?.startedAt?.toISOString()}
        data-answered-in-round={chainlinkFeed.data?.answeredInRound}
        data-derived-price={chainlinkFeed.data?.price}
        className="mb-5 rounded-xl border border-[#0847F7]/40 bg-gradient-to-r from-[#161B26] via-[#121A2A] to-[#161B26] p-4 shadow-panel"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#0847F7]/40 bg-[#0847F7]/15 text-[#0847F7]">
              <Radio className="h-5 w-5 animate-pulse text-[#0847F7]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00B171]/40 bg-[#00B171]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#00B171]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00B171] animate-ping" />
                  Live Sepolia Testnet Feed
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  Sepolia: 0x694AA1...5306
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-[#0847F7]/30 bg-[#0847F7]/15 px-2 py-0.5 font-mono text-[10px] text-[#7DD3FC]">
                  <span className="h-1 w-1 rounded-full bg-[#0847F7] animate-pulse" />
                  Polled {chainlinkFeed.secondsAgo}s ago &bull; Next in {chainlinkFeed.nextPollIn}s
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Continuous RPC sync via public Sepolia testnet nodes &bull; AggregatorV3Interface.latestRoundData()
              </p>
            </div>
          </div>

          {/* Live data readout */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t border-[#2A3347] pt-3 lg:border-t-0 lg:pt-0">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {chainlinkFeed.data?.pair || "ETH / USD"} (Chainlink)
              </p>
              <div className="flex items-baseline gap-2">
                {chainlinkFeed.isLoading && !chainlinkFeed.data ? (
                  <Skeleton className="h-6 w-24 mt-1" />
                ) : (
                  <p className="font-mono text-xl font-bold tracking-tight text-white">
                    ${chainlinkFeed.data?.price ?? "—"}
                  </p>
                )}
                <span className="text-[11px] font-mono text-[#00B171]">USD</span>
              </div>
            </div>

            <div className="hidden sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Round ID
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                {chainlinkFeed.data?.roundId ? `#${chainlinkFeed.data.roundId.slice(0, 8)}...` : "—"}
              </p>
            </div>

            <div className="hidden sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Oracle Block Time
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                {chainlinkFeed.data?.updatedAt
                  ? chainlinkFeed.data.updatedAt.toLocaleTimeString()
                  : "Live Sync"}
              </p>
              <p className="text-[9px] text-muted-foreground/60 leading-none mt-0.5">
                New block on &ge;0.5% move
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-[#2A3347] bg-[#161B26] text-xs text-white hover:bg-[#1F2637]"
                onClick={() => {
                  chainlinkFeed.refetch();
                  toast.info("Querying Sepolia Testnet RPC...", {
                    description: "Calling latestRoundData() on Chainlink Feed contract 0x694AA1...",
                  });
                }}
                disabled={chainlinkFeed.isLoading}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1.5 ${
                    chainlinkFeed.isLoading ? "animate-spin text-[#0847F7]" : ""
                  }`}
                />
                {chainlinkFeed.isLoading ? "Reading..." : "Refresh Feed"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInspector(!showInspector)}
                className="h-8 border border-[#0847F7]/30 bg-[#0847F7]/10 text-xs text-[#7DD3FC] hover:bg-[#0847F7]/20 hover:text-white"
                title="Inspect raw Solidity latestRoundData() return values"
              >
                <Code2 className="h-3.5 w-3.5 mr-1 text-[#0847F7]" />
                {showInspector ? "Hide Payload" : "Inspect On-Chain Payload"}
                {showInspector ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>
              <a
                href="https://sepolia.etherscan.io/address/0x694AA1769357215DE4FAC081bf1f309aDC325306"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#2A3347] bg-[#161B26] text-muted-foreground hover:text-white transition-colors"
                title="View contract on Sepolia Etherscan"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Interactive Solidity Tuple Inspector (Developer & Reviewer Verification) */}
        {showInspector && (
          <div className="mt-4 rounded-lg border border-[#2A3347] bg-[#0E1119] p-4 text-xs font-mono animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A3347] mb-3 text-muted-foreground">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <Code2 className="h-4 w-4 text-[#0847F7]" />
                AggregatorV3Interface.latestRoundData() &mdash; Live Sepolia Response
              </span>
              <span className="text-[10px] text-[#00B171] font-semibold">
                ON-CHAIN VERIFIED TUPLE
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px]">
              <div className="rounded border border-[#2A3347]/60 bg-[#161B26] p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase">uint80 roundId</p>
                <p className="text-white font-semibold mt-0.5 break-all">
                  {chainlinkFeed.data?.roundId || "Loading..."}
                </p>
              </div>
              <div className="rounded border border-[#2A3347]/60 bg-[#161B26] p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase">int256 answer</p>
                <p className="text-[#00B171] font-semibold mt-0.5 break-all">
                  {chainlinkFeed.data?.rawAnswer || "Loading..."}
                </p>
              </div>
              <div className="rounded border border-[#2A3347]/60 bg-[#161B26] p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase">uint256 startedAt</p>
                <p className="text-white mt-0.5">
                  {chainlinkFeed.data?.startedAt
                    ? `${Math.floor(chainlinkFeed.data.startedAt.getTime() / 1000)} (${chainlinkFeed.data.startedAt.toLocaleTimeString()})`
                    : "—"}
                </p>
              </div>
              <div className="rounded border border-[#2A3347]/60 bg-[#161B26] p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase">uint256 updatedAt</p>
                <p className="text-white mt-0.5">
                  {chainlinkFeed.data?.updatedAt
                    ? `${Math.floor(chainlinkFeed.data.updatedAt.getTime() / 1000)} (${chainlinkFeed.data.updatedAt.toLocaleTimeString()})`
                    : "—"}
                </p>
              </div>
              <div className="rounded border border-[#2A3347]/60 bg-[#161B26] p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase">uint80 answeredInRound</p>
                <p className="text-white mt-0.5 break-all">
                  {chainlinkFeed.data?.answeredInRound || "—"}
                </p>
              </div>
              <div className="rounded border border-[#2A3347]/60 bg-[#161B26] p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase">uint8 decimals</p>
                <p className="text-white mt-0.5">{chainlinkFeed.data?.decimals ?? 8}</p>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#2A3347] flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <span className="text-muted-foreground">
                Derivation Math:{" "}
                <span className="text-[#7DD3FC] font-semibold">
                  {chainlinkFeed.data?.mathFormula}
                </span>
              </span>
              <span className="text-muted-foreground">
                Contract:{" "}
                <span className="text-white font-mono">0x694AA1769357215DE4FAC081bf1f309aDC325306</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-panel">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID, network, partner, amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Currency pair */}
          <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="h-9 w-[120px] text-xs">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              <SelectItem value="XSGD">XSGD</SelectItem>
              <SelectItem value="USDC">USDC</SelectItem>
              <SelectItem value="BIDR">BIDR</SelectItem>
            </SelectContent>
          </Select>

          {/* Network Rail filter */}
          <Select value={railFilter} onValueChange={setRailFilter}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Network / Rail" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rails</SelectItem>
              <SelectItem value="FAST">Singapore FAST</SelectItem>
              <SelectItem value="BI-FAST">Indonesia BI-FAST</SelectItem>
              <SelectItem value="Ethereum">Ethereum</SelectItem>
              <SelectItem value="Polygon">Polygon</SelectItem>
              <SelectItem value="Avalanche">Avalanche</SelectItem>
              <SelectItem value="Hedera">Hedera</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery ||
            statusFilter !== "all" ||
            currencyFilter !== "all" ||
            railFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCurrencyFilter("all");
                setRailFilter("all");
              }}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left">
                {["Status", "Transaction ID", "Route", "Date", "Amount", "Quick Actions"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${
                      h === "Amount" ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledger.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No transactions match your current search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-[#1F2637]/50 ${
                      selected?.id === row.id ? "bg-[#0847F7]/12 shadow-[inset_3px_0_0_0_#0847F7]" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[row.status]}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            row.status === "settled"
                              ? "bg-[#00B171]"
                              : row.status === "processing"
                              ? "bg-[#0847F7] animate-pulse"
                              : row.status === "pending"
                              ? "bg-[#F5A623]"
                              : "bg-[#EF4444]"
                          }`}
                        />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 tabular text-[13px] font-medium text-white">
                      {row.id}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {row.sourceRail}
                        <ArrowRight className="h-3 w-3 text-[#0847F7]" />
                        {row.destinationRail}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 tabular text-xs text-muted-foreground">
                      {row.date ? new Date(row.date).toLocaleString("en-SG") : "—"}
                    </td>
                    <td className="px-4 py-3.5 tabular text-right text-[13px] font-semibold text-white">
                      {formatMoney(row.amount, row.currency)}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.status === "pending" || row.status === "processing" ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-[#0847F7] text-white font-semibold hover:bg-[#0847F7]/85 shadow-sm shadow-[#0847F7]/25"
                          onClick={() => handleApprove(row.id)}
                        >
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {row.status === "settled" ? "RECONCILED" : "TERMINATED"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Conversion Drawer with Functional State Mutation */}
        {selected && (
          <aside className="hidden w-[380px] shrink-0 animate-in slide-in-from-right-6 duration-200 lg:block">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-5 shadow-drawer">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Quick conversion
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLE[selected.status]}`}
                    >
                      {selected.status}
                    </span>
                  </div>
                  <p className="tabular mt-1 text-lg font-semibold text-white">{selected.id}</p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted"
                  aria-label="Close drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Dynamic Live Ticking FX Rate display */}
              <div className="mt-5 rounded-lg border border-[#2A3347] bg-[#0E1119] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-[#7DD3FC]">
                    <Lock className="h-3.5 w-3.5 text-[#0847F7]" /> LIVE FX RATE LOCK
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-[#00B171] animate-ping" />
                </div>
                <p className="metric-xl mt-2 tracking-tight text-white">
                  {selected.fxRate.toLocaleString("en-SG", {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 4,
                  })}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Rate expires:{" "}
                  {selected.fxLockedUntil
                    ? new Date(selected.fxLockedUntil).toLocaleTimeString("en-SG")
                    : "—"}
                </p>
              </div>

              <dl className="mt-4 space-y-3 text-[13px]">
                {[
                  ["Amount", formatMoney(selected.amount, selected.currency)],
                  ["Counterparty", selected.counterparty],
                  ["Source rail", selected.sourceRail],
                  ["Destination rail", selected.destinationRail],
                  ["Network fee", formatMoney(selected.networkFee, "USD")],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-border pb-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium text-white">{v}</dd>
                  </div>
                ))}
                {selected.creWorkflowTrigger && (
                  <div className="flex justify-between gap-4 border-b border-border pb-2">
                    <dt className="text-muted-foreground">CRE Workflow Trigger</dt>
                    <dd className="text-right font-mono text-[11px] text-[#7DD3FC]">
                      {selected.creWorkflowTrigger}
                    </dd>
                  </div>
                )}
                {selected.ccipMessageId && (
                  <div className="flex flex-col gap-1 border-b border-border pb-2">
                    <dt className="text-muted-foreground">CCIP Message ID</dt>
                    <dd className="font-mono text-[11px] text-[#38BDF8] break-all">
                      <a
                        href={`https://ccip.chain.link/msg/${selected.ccipMessageId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline inline-flex items-center gap-1"
                      >
                        {selected.ccipMessageId.slice(0, 16)}...{selected.ccipMessageId.slice(-8)}
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
                  <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Fuel className="h-3.5 w-3.5 text-[#0847F7]" /> Gas cost
                  </dt>
                  <dd className="tabular font-medium text-white">
                    {selected.gasCost} {selected.gasCurrency}
                  </dd>
                </div>
              </dl>

              {/* Functional Rail Override Form */}
              <div className="mt-4 rounded-lg border border-border/80 bg-muted/40 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                    Rail Override Routing
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={overrideTargetRail || selected.destinationRail}
                    onValueChange={setOverrideTargetRail}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue placeholder="Select target rail" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_RAILS.map((rail) => (
                        <SelectItem key={rail} value={rail}>
                          {rail}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs shrink-0"
                    onClick={() => handleOverrideRail(selected.id)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Override
                  </Button>
                </div>
              </div>

              {/* Action Buttons with physical UI state mutation */}
              <div className="mt-5 space-y-2">
                <Button
                  className="w-full"
                  disabled={selected.status === "settled"}
                  onClick={() => handleApprove(selected.id)}
                >
                  <Check className="h-4 w-4" />{" "}
                  {selected.status === "settled" ? "Transaction Settled" : "Approve Transaction"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={selected.status === "failed"}
                  onClick={() => handleReject(selected.id)}
                >
                  <X className="h-4 w-4" /> Reject Transaction
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </HubShell>
  );
}

