import { createFileRoute } from "@tanstack/react-router";
import { Building2, Link2, Pause, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { HubShell, formatCompact } from "@/components/hub-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useApexDualRail } from "@/hooks/useApexDualRail";
import type { RailHealth } from "@/lib/apex";

export const Route = createFileRoute("/rails")({
  head: () => ({
    meta: [
      { title: "Rail & Acquisition Map — Apex Rail" },
      {
        name: "description",
        content:
          "Live health grid for partner bank rails such as FAST and BI-FAST alongside blockchain network latency and uptime.",
      },
      { property: "og:title", content: "Rail & Acquisition Map — Apex Rail" },
      {
        property: "og:description",
        content: "Latency, uptime and throughput for every fiat and blockchain rail.",
      },
    ],
  }),
  component: RailsPage,
});

const STATUS_DOT: Record<RailHealth["status"], string> = {
  operational: "bg-[#00B171]",
  degraded: "bg-[#F5A623]",
  paused: "bg-[#8A94A6]",
  down: "bg-[#EF4444]",
};

function RailsPage() {
  const { rails, live, pauseRail } = useApexDualRail();

  const togglePause = (rail: RailHealth) => {
    const isCurrentlyPaused = rail.status === "paused";
    pauseRail(rail.id, !isCurrentlyPaused);
    toast[isCurrentlyPaused ? "success" : "warning"](
      isCurrentlyPaused ? `${rail.name} rail resumed` : `${rail.name} rail paused`,
      { description: isCurrentlyPaused ? "Rail traffic active and latency telemetry tracking." : "Rail traffic suspended in sandbox routing pipeline." },
    );
  };

  return (
    <HubShell
      title="Rail & Acquisition Map"
      subtitle="Partner bank rails and blockchain network health"
      live={live}
      isFetching={rails.isFetching}
    >
      {rails.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rails.data.map((rail) => {
            const isPaused = rail.status === "paused";
            return (
              <div
                key={rail.id}
                className={`rounded-xl border border-border bg-card p-5 shadow-panel transition-all ${
                  isPaused ? "opacity-70 bg-muted/20" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A3347] bg-[#0E1119]">
                      {rail.type === "bank" ? (
                        <Building2 className="h-4 w-4 text-[#0847F7]" />
                      ) : (
                        <Link2 className="h-4 w-4 text-[#0847F7]" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{rail.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {rail.region} · {rail.type === "bank" ? "Bank rail" : "Blockchain"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                      rail.status === "operational"
                        ? "border-[#00B171]/30 bg-[#00B171]/10 text-[#00B171]"
                        : rail.status === "degraded"
                        ? "border-[#F5A623]/30 bg-[#F5A623]/10 text-[#F5A623]"
                        : rail.status === "paused"
                        ? "border-[#8A94A6]/30 bg-[#8A94A6]/10 text-[#8A94A6]"
                        : "border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[rail.status]}`}
                    />
                    {rail.status}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ["Latency", `${rail.latencyMs.toLocaleString()} ms`],
                    ["Uptime", `${rail.uptime.toFixed(2)}%`],
                    ["24h txns", formatCompact(rail.throughput24h)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-[#2A3347] bg-[#0E1119] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                      <p className="tabular mt-0.5 text-sm font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-[11px] text-muted-foreground">
                    {rail.lastIncident
                      ? `Last incident ${new Date(rail.lastIncident).toLocaleDateString("en-SG")}`
                      : "No incidents recorded"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isPaused}
                      onCheckedChange={() => togglePause(rail)}
                      aria-label={`Pause ${rail.name}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-7 px-2.5 text-[11px] font-medium transition-colors ${
                        isPaused
                          ? "border-[#0847F7] bg-[#0847F7] text-white hover:bg-[#0847F7]/90 shadow-sm"
                          : "border-[#0847F7]/40 bg-[#0847F7]/10 text-[#0847F7] hover:bg-[#0847F7]/20"
                      }`}
                      onClick={() => togglePause(rail)}
                    >
                      {isPaused ? (
                        <>
                          <Play className="h-3 w-3 mr-1" /> Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-3 w-3 mr-1" /> Pause rail
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </HubShell>
  );
}
