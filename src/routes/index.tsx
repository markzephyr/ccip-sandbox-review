import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Fuel,
  Lock,
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
import type { LedgerRow, LedgerStatus } from "@/lib/apex";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dual-Rail Ledger — Apex Rail" },
      {
        name: "description",
        content:
          "Monitor settlement flowing between fiat banking rails and blockchain networks with live FX rate locks and gas costs.",
      },
      { property: "og:title", content: "Dual-Rail Ledger — Apex Rail" },
      {
        property: "og:description",
        content: "Institutional console for fiat and stablecoin settlement across dual rails.",
      },
    ],
  }),
  component: LedgerPage,
});

const STATUS_STYLE: Record<LedgerStatus, string> = {
  settled: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40",
  processing: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

const AVAILABLE_RAILS = [
  "Ethereum",
  "Polygon",
  "Avalanche",
  "Hedera",
  "Zilliqa",
  "FAST · Tier-1 Clearing Bank A",
  "FAST · Tier-1 Clearing Bank B",
  "FAST · Tier-1 Clearing Bank C",
  "FAST · Tier-1 Clearing Bank D",
  "BI-FAST · Regional Clearing Bank A",
  "BI-FAST · Regional Clearing Bank B",
];

function LedgerPage() {
  const { ledger, live, approveTransaction, overrideRail, rejectTransaction } =
    useApexDualRail();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
              <SelectItem value="SGDX">SGDX</SelectItem>
              <SelectItem value="USDX">USDX</SelectItem>
              <SelectItem value="IDRX">IDRX</SelectItem>
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
                    className={`cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-mint-tint ${
                      selected?.id === row.id ? "bg-mint-tint" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[row.status]}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            row.status === "settled"
                              ? "bg-emerald-500"
                              : row.status === "processing"
                              ? "bg-blue-500 animate-pulse"
                              : row.status === "pending"
                              ? "bg-amber-500"
                              : "bg-destructive"
                          }`}
                        />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 tabular text-[13px] font-medium text-teal">
                      {row.id}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {row.sourceRail}
                        <ArrowRight className="h-3 w-3 text-primary" />
                        {row.destinationRail}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 tabular text-xs text-muted-foreground">
                      {row.date ? new Date(row.date).toLocaleString("en-SG") : "—"}
                    </td>
                    <td className="px-4 py-3.5 tabular text-right text-[13px] font-semibold text-teal">
                      {formatMoney(row.amount, row.currency)}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.status === "pending" || row.status === "processing" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10"
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
                  <p className="tabular mt-1 text-lg font-semibold text-teal">{selected.id}</p>
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
              <div className="mt-5 rounded-lg bg-mint-tint p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-teal">
                    <Lock className="h-3.5 w-3.5 text-primary" /> LIVE FX RATE LOCK
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="metric-xl mt-2 tracking-tight">
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
                    <dd className="text-right font-medium text-teal">{v}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
                  <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Fuel className="h-3.5 w-3.5" /> Gas cost
                  </dt>
                  <dd className="tabular font-medium text-teal">
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

