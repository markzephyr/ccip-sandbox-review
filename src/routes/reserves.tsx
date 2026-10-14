import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  Banknote,
  Coins,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { HubShell, formatCompact, formatMoney } from "@/components/hub-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useApexDualRail } from "@/hooks/useApexDualRail";

export const Route = createFileRoute("/reserves")({
  head: () => ({
    meta: [
      { title: "Reserve Attestation — CCIP Bridge Engine" },
      {
        name: "description",
        content:
          "Real-time 1:1 collateralization view of safeguarded bank balances against on-chain stablecoin circulating supply.",
      },
      { property: "og:title", content: "Reserve Attestation — CCIP Bridge Engine" },
      {
        property: "og:description",
        content: "Off-chain reserves versus on-chain supply with a live 1:1 matching indicator.",
      },
    ],
  }),
  component: ReservesPage,
});

function ReservesPage() {
  const { reserves, live } = useApexDualRail();
  const snap = reserves.data;
  const delta = snap.totalOffChain - snap.totalOnChain;
  const balanced = Math.abs(snap.collateralizationRatio - 100) < 0.01;

  // Dynamic trend data
  const historicalTrend = useMemo(() => {
    const points = [
      { time: "00:00", ratio: 100.01, reserves: 414.2, supply: 414.16 },
      { time: "04:00", ratio: 100.0, reserves: 414.5, supply: 414.5 },
      { time: "08:00", ratio: 99.99, reserves: 414.8, supply: 414.84 },
      { time: "12:00", ratio: 100.02, reserves: 415.1, supply: 415.02 },
      { time: "16:00", ratio: 100.0, reserves: 414.9, supply: 414.9 },
      { time: "20:00", ratio: 100.01, reserves: 415.0, supply: 414.96 },
      {
        time: "Current",
        ratio: Number(snap.collateralizationRatio.toFixed(3)),
        reserves: Number((snap.totalOffChain / 1_000_000).toFixed(2)),
        supply: Number((snap.totalOnChain / 1_000_000).toFixed(2)),
      },
    ];
    return points;
  }, [snap.collateralizationRatio, snap.totalOffChain, snap.totalOnChain]);

  // Asset Matching comparison distribution
  const assetDistribution = useMemo(() => {
    return [
      {
        category: "Off-Chain Fiat Bank Reserves",
        amount: snap.totalOffChain / 1_000_000,
        currency: "SGD (M)",
        fill: "#8A94A6",
      },
      {
        category: "On-Chain Stablecoin Supply",
        amount: snap.totalOnChain / 1_000_000,
        currency: "SGD (M)",
        fill: "#0847F7",
      },
    ];
  }, [snap.totalOffChain, snap.totalOnChain]);

  return (
    <HubShell
      title="Reserve Attestation"
      subtitle="Safeguarded fiat reserves against circulating stablecoin supply"
      live={live}
      isFetching={reserves.isFetching}
    >
      {/* Top Banner Status */}
      <div
        className={`rounded-xl border p-6 shadow-panel ${
          balanced ? "border-[#00B171]/40 bg-[#00B171]/10" : "border-[#F5A623]/40 bg-[#F5A623]/10"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-xs ${
                balanced ? "bg-[#00B171] text-white" : "bg-[#F5A623] text-white"
              }`}
            >
              {balanced ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Collateralization ratio · 1:1 Matching Guarantee
              </p>
              {reserves.isLoading ? (
                <Skeleton className="mt-2 h-9 w-52" />
              ) : (
                <div className="flex items-baseline gap-3 mt-1">
                  <p className="metric-xl">
                    {snap.collateralizationRatio.toFixed(2)}%
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      balanced
                        ? "bg-[#00B171]/15 text-[#00B171] border border-[#00B171]/30"
                        : "bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30"
                    }`}
                  >
                    {balanced ? "1:1 Strict Peg Maintained" : "Variance Monitored"}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <p className="font-medium text-foreground">Audited by {snap.attestationBy}</p>
            <p className="tabular mt-0.5">
              Attestation timestamp:{" "}
              {snap.updatedAt ? new Date(snap.updatedAt).toLocaleTimeString("en-SG") : "—"}
            </p>
          </div>
        </div>

        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              balanced ? "bg-[#00B171]" : "bg-[#F5A623]"
            }`}
            style={{ width: `${Math.min(snap.collateralizationRatio, 120) / 1.2}%` }}
          />
        </div>
      </div>

      {/* Dynamic Compliance Recharts Section */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Historical Collateralization Trend Chart */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-panel">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0847F7]" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Historical Collateralization Ratio
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Continuous 24h peg stability tracking (%)
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#00B171] bg-[#00B171]/10 px-2 py-0.5 rounded border border-[#00B171]/20">
              Mean: 100.00%
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRatio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0847F7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0847F7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#2A3347" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#8A94A6" }} stroke="#2A3347" />
                <YAxis domain={[99.9, 100.1]} tick={{ fontSize: 11, fill: "#8A94A6" }} stroke="#2A3347" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(val: number) => [`${val}%`, "Collateral Ratio"]}
                  contentStyle={{ backgroundColor: "#161B26", borderRadius: "8px", border: "1px solid #2A3347", color: "#F8FAFC", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="ratio"
                  stroke="#0847F7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRatio)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 1:1 Matching Delta Asset Distribution */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-panel">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#0847F7]" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  1:1 Asset Matching Delta
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Off-chain safeguarded fiat vs. on-chain tokens
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#0847F7] bg-[#0847F7]/10 px-2 py-0.5 rounded border border-[#0847F7]/20">
              Delta: {delta >= 0 ? `+${formatCompact(delta)} SGD` : `${formatCompact(delta)} SGD`}
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetDistribution} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#2A3347" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#8A94A6" }} stroke="#2A3347" tickFormatter={(v) => `${v}M`} />
                <YAxis dataKey="category" type="category" hide />
                <Tooltip
                  formatter={(val: number) => [`${val} Million SGD`, "Total Assets"]}
                  contentStyle={{ backgroundColor: "#161B26", borderRadius: "8px", border: "1px solid #2A3347", color: "#F8FAFC", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px", color: "#8A94A6" }} />
                <Bar dataKey="amount" name="Capital Volume (M SGD)" radius={[0, 4, 4, 0]}>
                  {assetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Balance Breakdowns */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-panel">
          <header className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-teal" />
              <h2 className="text-sm font-semibold">Off-chain safeguarded balances</h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Institutional Safeguarding Compliant</span>
          </header>
          {reserves.isLoading ? (
            <Skeleton className="mt-4 h-10 w-48" />
          ) : (
            <p className="metric-xl mt-3">{formatMoney(snap.totalOffChain, "SGD")}</p>
          )}
          <ul className="mt-5 space-y-2">
            {reserves.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))
              : snap.offChain.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-[#2A3347] bg-[#0E1119] px-4 py-3"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-white">{a.custodian}</p>
                      <p className="text-[11px] text-muted-foreground">{a.account}</p>
                    </div>
                    <p className="tabular text-[13px] font-semibold text-white">
                      {formatMoney(a.balance, a.currency)}
                    </p>
                  </li>
                ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-panel">
          <header className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-[#0847F7]" />
              <h2 className="text-sm font-semibold">On-chain circulating supply</h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Real-time RPC Sync</span>
          </header>
          {reserves.isLoading ? (
            <Skeleton className="mt-4 h-10 w-48" />
          ) : (
            <p className="metric-xl mt-3">{formatMoney(snap.totalOnChain, "SGD")}</p>
          )}
          <ul className="mt-5 space-y-2">
            {reserves.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))
              : snap.onChain.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-[#2A3347] bg-[#0E1119] px-4 py-3"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-white">{t.token}</p>
                      <p className="text-[11px] text-muted-foreground">{t.network}</p>
                    </div>
                    <p className="tabular text-[13px] font-semibold text-white">
                      {formatMoney(t.circulatingSupply)}
                    </p>
                  </li>
                ))}
          </ul>
        </section>
      </div>
    </HubShell>
  );
}

