import { createFileRoute } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { HubShell } from "@/components/hub-shell";
import { Button } from "@/components/ui/button";
import { useApexDualRail } from "@/hooks/useApexDualRail";

export const Route = createFileRoute("/developer")({
  head: () => ({
    meta: [
      { title: "Developer Canvas — CCIP Bridge Engine" },
      {
        name: "description",
        content:
          "TypeScript interfaces and React snippets for the unified useApexDualRail hook covering ledger, rails and reserves.",
      },
      { property: "og:title", content: "Developer Canvas — CCIP Bridge Engine" },
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
    note: "The institutional backend emits snake_case; these are the normalised view models.",
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
    title: "useApexDualRail",
    note: "A single hook polls all three routes every 5 seconds and exposes fetch state per feed.",
    code: `const POLL_MS = 5_000;

export function useApexDualRail() {
  const ledger   = useFeed("/api/ledger",            parseLedger);
  const rails    = useFeed("/api/rails/health",      parseRails);
  const reserves = useFeed("/api/treasury/reserves", parseReserves);

  return { ledger, rails, reserves, live: ledger.live };
}

function useFeed<T>(path: string, parse: (p: unknown) => T) {
  const query = useQuery({
    queryKey: ["apex", path],
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
  const { ledger } = useApexDualRail();

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

function highlightCode(code: string) {
  // Simple token-based highlighter for TypeScript syntax in VS Code Dark Modern style
  const lines = code.split("\n");
  return lines.map((line, lineIdx) => {
    // Check for comment
    const commentIdx = line.indexOf("//");
    let codePart = commentIdx !== -1 ? line.slice(0, commentIdx) : line;
    const commentPart = commentIdx !== -1 ? line.slice(commentIdx) : "";

    // Highlight strings
    const tokens: Array<{ text: string; color: string }> = [];
    // Regex for keywords, types, strings, numbers, identifiers
    const regex = /(".*?"|'.*?'|`.*?`|\b(?:export|type|interface|const|function|return|boolean|string|number|null|undefined|await|async|if|else)\b|\b[A-Z][a-zA-Z0-9_]*\b|\b[0-9]+(?:\.[0-9]+)?(?:_[0-9]+)?\b|[a-zA-Z_$][a-zA-Z0-9_$]*|[^\s\w]+|\s+)/g;

    let match;
    let lastIndex = 0;
    while ((match = regex.exec(codePart)) !== null) {
      const token = match[0];
      let color = "#D4D4D4"; // default VS Code Dark Modern text

      if (token.startsWith('"') || token.startsWith("'") || token.startsWith("`")) {
        color = "#CE9178"; // string (warm terracotta orange)
      } else if (
        /^(export|type|interface|const|function|return|await|async|if|else)$/.test(token)
      ) {
        color = "#569CD6"; // keyword (VS Code blue)
      } else if (/^(boolean|string|number|null|undefined)$/.test(token)) {
        color = "#4EC9B0"; // primitive types (teal green)
      } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(token)) {
        color = "#4EC9B0"; // Interface / Type / Component names
      } else if (/^[0-9]+(?:\.[0-9]+)?(?:_[0-9]+)?$/.test(token)) {
        color = "#B5CEA8"; // numbers (soft light green)
      } else if (/^(use[A-Z][a-zA-Z0-9_]*|fetchJson|parse[A-Z][a-zA-Z0-9_]*)$/.test(token)) {
        color = "#DCDCAA"; // functions (warm soft yellow)
      } else if (/^[a-z_][a-zA-Z0-9_]*$/.test(token)) {
        color = "#9CDCFE"; // property names / variables (light sky blue)
      } else if (/^[:=;{}()[\],.<>|]$/.test(token)) {
        color = "#D4D4D4"; // delimiters
      }

      tokens.push({ text: token, color });
      lastIndex = regex.lastIndex;
    }

    return (
      <div key={lineIdx} className="table-row">
        <span className="table-cell select-none pr-4 text-right font-mono text-[11px] text-[#5A6982]">
          {lineIdx + 1}
        </span>
        <span className="table-cell whitespace-pre font-mono">
          {tokens.map((t, i) => (
            <span key={i} style={{ color: t.color }}>
              {t.text}
            </span>
          ))}
          {commentPart && <span style={{ color: "#6A9955" }}>{commentPart}</span>}
        </span>
      </div>
    );
  });
}

function DeveloperPage() {
  const { live, ledger } = useApexDualRail();

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
            <span className="inline-flex items-center rounded-md bg-[#0847F7]/15 border border-[#38BDF8]/30 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#7DD3FC]">
              {method}
            </span>
            <div className="mt-2 inline-block rounded-md bg-[#0847F7]/10 border border-[#38BDF8]/20 px-2.5 py-1">
              <p className="tabular font-mono text-[12px] font-medium text-[#BAE6FD]">{path}</p>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Polled every 5 seconds</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {SNIPPETS.map((s) => (
          <section key={s.title} className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
            {/* Terminal Header */}
            <header className="flex items-center justify-between gap-4 border-b border-border bg-[#121620] px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Window control dots */}
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F5A623]/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00B171]/80" />
                </div>
                <div className="border-l border-border/80 pl-3">
                  <h2 className="text-xs font-semibold text-white tracking-wide">{s.title}</h2>
                  <p className="text-[10px] text-muted-foreground">{s.note}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-[#C8D1E0] hover:text-white hover:bg-[#1F2637]"
                onClick={() => {
                  navigator.clipboard?.writeText(s.code);
                  toast.success("Snippet copied");
                }}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </header>

            {/* Dark Terminal Window with VS Code Dark Modern Colors */}
            <div className="overflow-x-auto bg-[#0B0D14] p-4 text-[12.5px] leading-relaxed">
              <div className="table w-full">{highlightCode(s.code)}</div>
            </div>
          </section>
        ))}
      </div>
    </HubShell>
  );
}
