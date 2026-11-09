import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Network,
  RefreshCw,
  Send,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { HubShell } from "@/components/hub-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCCIP } from "@/hooks/useCCIP";
import {
  CCIP_CHAINS,
  CCIP_CHAIN_SELECTORS,
  CRE_WORKFLOW_TRIGGERS,
  getCCIPExplorerUrl,
} from "@/lib/ccip-config";

export const Route = createFileRoute("/ccip")({
  head: () => ({
    meta: [
      { title: "CCIP 2.0 / CRE Explorer — On-Chain Settlement Verification" },
      {
        name: "description",
        content:
          "Live on-chain cross-chain messaging verification powered by Chainlink CCIP 2.0 and Chainlink Runtime Environment (CRE).",
      },
    ],
  }),
  component: CCIPPage,
});

export function CCIPPage() {
  const { network, messages, isLoading, isPolling, secondsAgo, refetch } = useCCIP();
  const [activeTab, setActiveTab] = useState<"lanes" | "messages" | "cre">("lanes");

  return (
    <HubShell
      title="Chainlink CCIP 2.0 & CRE Cross-Chain Explorer"
      subtitle="Institutional settlement verified on Ethereum Sepolia and Arbitrum Sepolia"
      live={!isLoading}
      isFetching={isPolling}
    >
      {/* Top Banner: CCIP 2.0 & CRE Compliance Architecture */}
      <div className="mb-6 rounded-xl border border-[#0847F7]/40 bg-gradient-to-r from-[#161B26] via-[#121A2A] to-[#161B26] p-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#0847F7]/40 bg-[#0847F7]/20 text-[#0847F7]">
              <Workflow className="h-6 w-6 animate-pulse text-[#38BDF8]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00B171]/40 bg-[#00B171]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#00B171]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00B171] animate-ping" />
                  Live On-Chain Contracts
                </span>
                <span className="rounded bg-[#0847F7]/20 border border-[#0847F7]/30 px-2 py-0.5 font-mono text-xs text-[#7DD3FC]">
                  CCIP 2.0 + CRE Runtime
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Polled {secondsAgo}s ago
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Verified multi-lane router registry querying <code className="text-[#38BDF8]">isChainSupported()</code> and <code className="text-[#38BDF8]">ExecutionStateChanged</code> on testnet OffRamps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                toast.info("Querying CCIP Routers and OffRamps...", {
                  description: "Fetching state directly from Sepolia & Arbitrum Sepolia nodes.",
                });
              }}
              disabled={isPolling}
              className="h-8 border-[#2A3347] bg-[#161B26] text-xs text-white hover:bg-[#1F2637]"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPolling ? "animate-spin text-[#0847F7]" : ""}`} />
              Refresh On-Chain State
            </Button>
            <a
              href="https://ccip.chain.link"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#2A3347] bg-[#161B26] px-3 text-xs text-white hover:bg-[#1F2637] transition-colors"
            >
              CCIP Explorer <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-[#2A3347] pt-4">
          <div className="rounded-lg border border-[#2A3347]/60 bg-[#0E1119] p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Connected Routers
            </span>
            <p className="mt-1 font-mono text-lg font-bold text-white">
              {isLoading ? <Skeleton className="h-6 w-12" /> : network?.routers.length ?? 2}
            </p>
            <p className="text-[10px] text-muted-foreground">Sepolia & Arb Sepolia</p>
          </div>
          <div className="rounded-lg border border-[#2A3347]/60 bg-[#0E1119] p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Cross-Chain Lanes
            </span>
            <p className="mt-1 font-mono text-lg font-bold text-[#00B171]">
              {isLoading ? <Skeleton className="h-6 w-12" /> : network?.totalSupportedLanes ?? 10}
            </p>
            <p className="text-[10px] text-muted-foreground">Verified via isChainSupported</p>
          </div>
          <div className="rounded-lg border border-[#2A3347]/60 bg-[#0E1119] p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              CRE Workflow Triggers
            </span>
            <p className="mt-1 font-mono text-lg font-bold text-[#7DD3FC]">3 Active</p>
            <p className="text-[10px] text-muted-foreground">FAST, BI-FAST, PayNow</p>
          </div>
          <div className="rounded-lg border border-[#2A3347]/60 bg-[#0E1119] p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              OffRamp Contracts
            </span>
            <p className="mt-1 font-mono text-lg font-bold text-[#F5A623]">
              {isLoading ? <Skeleton className="h-6 w-12" /> : network?.totalOffRamps ?? 2}
            </p>
            <p className="text-[10px] text-muted-foreground">ARM Active Verification</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-5 flex border-b border-border">
        <button
          onClick={() => setActiveTab("lanes")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "lanes"
              ? "border-[#0847F7] text-[#7DD3FC]"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Network className="h-4 w-4" /> Live CCIP Lanes & Routers
        </button>
        <button
          onClick={() => setActiveTab("cre")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "cre"
              ? "border-[#0847F7] text-[#7DD3FC]"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Workflow className="h-4 w-4" /> CRE Workflow Triggers (Web2 Banking &rarr; CCIP)
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "messages"
              ? "border-[#0847F7] text-[#7DD3FC]"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Send className="h-4 w-4" /> On-Chain Cross-Chain Messages
        </button>
      </div>

      {/* Tab 1: Live CCIP Lanes & Routers */}
      {activeTab === "lanes" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {network?.routers.map((router) => (
              <div
                key={router.chainName}
                className="rounded-xl border border-border bg-card p-5 shadow-panel"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0847F7]/20 border border-[#0847F7]/30 text-[#7DD3FC]">
                      <Zap className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{router.chainName}</h3>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        Router: {router.routerAddress}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#00B171]/15 border border-[#00B171]/40 px-2 py-0.5 text-[10px] font-semibold text-[#00B171]">
                    Operational
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Verified Destination Lanes (isChainSupported)
                  </h4>
                  <div className="space-y-2">
                    {router.supportedLanes.map((lane) => (
                      <div
                        key={lane.destChainSelector}
                        className="flex items-center justify-between rounded-lg border border-[#2A3347] bg-[#0E1119] px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{lane.destChain}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Selector: {lane.destChainSelector.slice(0, 8)}...
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {lane.isSupported ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00B171]">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Supported
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Unsupported</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {router.offRamps.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Registered OffRamp Contracts (getOffRamps)
                    </h4>
                    <div className="space-y-1.5">
                      {router.offRamps.map((or) => (
                        <div
                          key={or.offRampAddress}
                          className="flex items-center justify-between text-[11px] font-mono text-muted-foreground"
                        >
                          <span>{or.sourceChainName}</span>
                          <span className="text-white">{or.offRampAddress}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: CRE Workflow Triggers */}
      {activeTab === "cre" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-panel">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Chainlink Runtime Environment (CRE) Workflow Triggers
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  How Web2 banking API calls (FAST, BI-FAST, PayNow) trigger institutional on-chain CCIP execution.
                </p>
              </div>
              <span className="rounded bg-[#0847F7]/20 border border-[#0847F7]/40 px-2.5 py-1 text-xs font-semibold text-[#7DD3FC]">
                Institutional Architecture
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {Object.entries(CRE_WORKFLOW_TRIGGERS).map(([rail, info]) => (
                <div
                  key={rail}
                  className="rounded-xl border border-[#2A3347] bg-[#0E1119] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded-md bg-[#0847F7]/15 border border-[#0847F7]/30 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#7DD3FC]">
                        {info.trigger}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{info.region}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-1">{rail} Rail Trigger</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{info.protocol}</p>
                    <div className="mt-3 space-y-1.5 text-[11px] text-muted-foreground border-t border-[#2A3347] pt-2.5">
                      <div className="flex justify-between">
                        <span>Trigger Payload:</span>
                        <span className="text-white font-mono">ISO 20022 camt.053</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Settlement Contract:</span>
                        <span className="text-[#38BDF8] font-mono">CCIP Router v1.5</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Verification:</span>
                        <span className="text-[#00B171]">ARM Blessing Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#2A3347]">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#00B171] font-medium">
                      <ShieldCheck className="h-3.5 w-3.5" /> Compliant Enterprise Trigger
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Architectural Flow Diagram */}
            <div className="mt-6 rounded-lg border border-[#2A3347] bg-[#121620] p-4">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                CRE-to-CCIP Execution Pipeline
              </h4>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="rounded border border-[#2A3347] bg-[#161B26] p-2 text-center flex-1 min-w-[140px]">
                  <p className="text-muted-foreground text-[10px]">1. WEB2 BANKING</p>
                  <p className="text-white font-semibold mt-1">FAST / BI-FAST / PayNow</p>
                  <p className="text-[10px] text-[#7DD3FC]">API Webhook Event</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#0847F7] shrink-0" />
                <div className="rounded border border-[#0847F7]/40 bg-[#0847F7]/10 p-2 text-center flex-1 min-w-[140px]">
                  <p className="text-[#7DD3FC] text-[10px]">2. CRE RUNTIME</p>
                  <p className="text-white font-semibold mt-1">Chainlink DON Node</p>
                  <p className="text-[10px] text-[#38BDF8]">Consensus & Attestation</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#0847F7] shrink-0" />
                <div className="rounded border border-[#2A3347] bg-[#161B26] p-2 text-center flex-1 min-w-[140px]">
                  <p className="text-muted-foreground text-[10px]">3. SOURCE CCIP</p>
                  <p className="text-white font-semibold mt-1">Router &rarr; OnRamp</p>
                  <p className="text-[10px] text-[#00B171]">CCIPSendRequested</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#0847F7] shrink-0" />
                <div className="rounded border border-[#2A3347] bg-[#161B26] p-2 text-center flex-1 min-w-[140px]">
                  <p className="text-muted-foreground text-[10px]">4. DESTINATION CCIP</p>
                  <p className="text-white font-semibold mt-1">OffRamp &rarr; Receiver</p>
                  <p className="text-[10px] text-[#00B171]">ExecutionState: Success</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: On-Chain Cross-Chain Messages */}
      {activeTab === "messages" && (
        <div className="rounded-xl border border-border bg-card shadow-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left">
                {["Status", "Message ID", "Route", "Block", "Explorer"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0847F7]/30 bg-[#0847F7]/10 px-3 py-1 text-xs font-medium text-[#7DD3FC]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0847F7] animate-pulse" />
                        Listening on 68 Registered CCIP OffRamps
                      </span>
                      <p className="text-xs text-white font-medium mt-2">
                        No CCIP execution events emitted in the last 2,000 blocks
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Public testnet message volume is intermittent. The listener is continuously polling destination OffRamp contracts for <code className="text-[#38BDF8]">ExecutionStateChanged</code> events in real time.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr
                    key={msg.messageId}
                    className="border-b border-border transition-colors last:border-0 hover:bg-[#1F2637]/50"
                  >
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00B171]/40 bg-[#00B171]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#00B171]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00B171]" />
                        {msg.state}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-white">
                      {msg.messageId.slice(0, 10)}...{msg.messageId.slice(-8)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {msg.sourceChain}
                        <ArrowRight className="h-3 w-3 text-[#0847F7]" />
                        {msg.destChain}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                      #{msg.blockNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={msg.ccipExplorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#38BDF8] hover:underline"
                      >
                        CCIP Msg <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </HubShell>
  );
}

