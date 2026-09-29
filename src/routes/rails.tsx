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
  operational: "bg-primary",
  degraded: "bg-warning",
  paused: "bg-muted-foreground",
  down: "bg-destructive",
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
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint-tint">
                      {rail.type === "bank" ? (
                        <Building2 className="h-4 w-4 text-teal" />
                      ) : (
                        <Link2 className="h-4 w-4 text-teal" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-teal">{rail.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {rail.region} · {rail.type === "bank" ? "Bank rail" : "Blockchain"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
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
                    <div key={label} className="rounded-lg bg-mint-tint px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                      <p className="tabular mt-0.5 text-sm font-semibold text-teal">{value}</p>
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
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
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
