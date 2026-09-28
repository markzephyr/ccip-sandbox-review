import { createFileRoute } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { HubShell } from "@/components/hub-shell";
import { Button } from "@/components/ui/button";
import { useStraitsXDualRail } from "@/hooks/useStraitsXDualRail";

export const Route = createFileRoute("/developer")({
  head: () => ({
    meta: [
      { title: "Developer Canvas — StraitsX Hub" },
      {
        name: "description",
        content:
          "TypeScript interfaces and React snippets for the unified useStraitsXDualRail hook covering ledger, rails and reserves.",
      },
      { property: "og:title", content: "Developer Canvas — StraitsX Hub" },
      {
        property: "og:description",
        content: "One hook for ledger, rail health and reserve attestation feeds.",
      },
    ],
  }),
  component: DeveloperPage,
});

const SNIPPETS: Array<{ title: string; note: string; code: string }> = [
  {
    title: "Payload contracts",
    note: "The FastAPI backend emits snake_case; these are the normalised view models.",
    code: `export type LedgerStatus = "settled" | "pending" | "failed" | "processing";

export interface LedgerRow {
  id: string;              // transaction_id
  status: LedgerStatus;    // global_status
  date: string;            // ISO 8601
  amount: number;
  currency: string;
  sourceRail: string;      // source_rail
  destinationRail: string; // destination_rail
  fxRate: number;          // fx_rate
  fxLockedUntil: string;   // fx_locked_until
  gasCost: number;         // gas_cost
  networkFee: number;      // network_fee
  requiresApproval: boolean;
}

export interface RailHealth {
  id: string;
  name: string;            // "FAST" | "BI-FAST" | "Polygon" ...
  type: "bank" | "chain";
  status: "operational" | "degraded" | "paused" | "down";
  latencyMs: number;       // latency_ms
  uptime: number;          // uptime_pct
  throughput24h: number;   // throughput_24h
}

export interface ReserveSnapshot {
  totalOffChain: number;           // total_off_chain
  totalOnChain: number;            // total_on_chain
  collateralizationRatio: number;  // collateralization_ratio
  attestationBy: string;
}`,
  },
  {
    title: "useStraitsXDualRail",
    note: "A single hook polls all three routes every 5 seconds and exposes fetch state per feed.",
    code: `const POLL_MS = 5_000;

export function useStraitsXDualRail() {
  const ledger   = useFeed("/api/ledger",            parseLedger);
  const rails    = useFeed("/api/rails/health",      parseRails);
  const reserves = useFeed("/api/treasury/reserves", parseReserves);

  return { ledger, rails, reserves, live: ledger.live };
}

function useFeed<T>(path: string, parse: (p: unknown) => T) {
  const query = useQuery({
    queryKey: ["straitsx", path],
    queryFn: ({ signal }) => fetchJson(path, signal).then(parse),
    refetchInterval: POLL_MS,
  });
  return { data: query.data, isFetching: query.isFetching };
}`,
  },
  {
    title: "Consuming in a component",
    note: "Skeletons render while a poll is in flight; layouts never shift on a partial payload.",
    code: `function LedgerTable() {
  const { ledger } = useStraitsXDualRail();

  if (ledger.isLoading) return <LedgerSkeleton rows={6} />;

  return (
    <Table>
      {ledger.data.map((row) => (
        <Row key={row.id} status={row.status} amount={row.amount} />
      ))}
    </Table>
  );
}`,
  },
];

function DeveloperPage() {
  const { live, ledger } = useStraitsXDualRail();

  return (
    <HubShell
      title="Developer Canvas"
      subtitle="Types and snippets for the unified dual-rail hook"
      live={live}
      isFetching={ledger.isFetching}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["GET", "/api/ledger"],
          ["GET", "/api/rails/health"],
          ["GET", "/api/treasury/reserves"],
        ].map(([method, path]) => (
          <div key={path} className="rounded-xl border border-border bg-card p-4 shadow-panel">
            <span className="rounded-md bg-primary/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-teal">
              {method}
            </span>
            <p className="tabular mt-2 text-[13px] text-teal">{path}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Polled every 5 seconds</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {SNIPPETS.map((s) => (
          <section key={s.title} className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
            <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
              <div>
                <h2 className="text-sm font-semibold">{s.title}</h2>
                <p className="text-[11px] text-muted-foreground">{s.note}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => {
                  navigator.clipboard?.writeText(s.code);
                  toast.success("Snippet copied");
                }}
              >
                <Copy className="h-3 w-3" /> Copy
              </Button>
            </header>
            <pre className="overflow-x-auto bg-teal px-5 py-4 text-[12.5px] leading-relaxed text-teal-foreground">
              <code>{s.code}</code>
            </pre>
          </section>
        ))}
      </div>
    </HubShell>
  );
}
