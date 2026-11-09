import { Link } from "@tanstack/react-router";
import { Activity, ArrowLeftRight, Code2, Layers, ShieldCheck, Zap } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Dual-Rail Ledger", icon: Layers },
  { to: "/ccip", label: "CCIP 2.0 / CRE Explorer", icon: ArrowLeftRight },
  { to: "/rails", label: "Rail & Acquisition Map", icon: Activity },
  { to: "/reserves", label: "Reserve Attestation", icon: ShieldCheck },
  { to: "/developer", label: "Developer Canvas", icon: Code2 },
] as const;

export function HubShell({
  title,
  subtitle,
  live,
  isFetching,
  children,
}: {
  title: string;
  subtitle: string;
  live: boolean;
  isFetching: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-sidebar-accent-foreground">CCIP Bridge Engine</p>
            <p className="text-[11px] text-sidebar-foreground/70">Multi-Chain Settlement</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#8A94A6] transition-colors hover:bg-[#1F2637]/60 hover:text-white"
              activeProps={{
                className:
                  "text-white bg-[#0847F7]/12 shadow-[inset_3px_0_0_0_#0847F7] font-semibold",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="m-3 rounded-lg border border-[#2A3347] bg-[#161B26] p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00B171] opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00B171]"></span>
            </span>
            <p className="text-[11px] font-semibold text-[#00B171]">
              CCIP 2.0 / CRE Live Engine
            </p>
          </div>
          <p className="mt-1 font-mono text-[10px] text-[#8A94A6]">
            CRE Workflow Triggers · Sepolia ↔ Arb Sepolia
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 self-start rounded-md border border-[#0847F7]/30 bg-[#0847F7]/10 px-2.5 py-1 text-[11px] font-medium text-[#0847F7] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0847F7]" />
              Chainlink Runtime Environment (CRE) &bull; CCIP 2.0
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 shadow-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                isFetching ? "animate-pulse bg-[#0847F7]" : "bg-[#00B171] animate-pulse"
              }`}
            />
            <span className="font-mono text-[11px] text-muted-foreground">
              {isFetching ? "SYNCING RPC" : "LIVE CCIP &bull; ON-CHAIN"}
            </span>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 py-2 md:hidden">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export function formatMoney(value: number, currency = "") {
  return `${value.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${
    currency ? ` ${currency}` : ""
  }`;
}

export function formatCompact(value: number) {
  return value.toLocaleString("en-SG", { notation: "compact", maximumFractionDigits: 2 });
}
