export const API_BASE = "https://vercel.app";

export type Rail = "fiat" | "crypto";
export type LedgerStatus = "settled" | "pending" | "failed" | "processing";

export interface LedgerRow {
  id: string;
  status: LedgerStatus;
  date: string;
  amount: number;
  currency: string;
  sourceRail: string;
  destinationRail: string;
  counterparty: string;
  direction: Rail;
  fxRate: number;
  fxLockedUntil: string;
  gasCost: number;
  gasCurrency: string;
  networkFee: number;
  requiresApproval: boolean;
}

export interface RailHealth {
  id: string;
  name: string;
  type: "bank" | "chain";
  region: string;
  status: "operational" | "degraded" | "paused" | "down";
  latencyMs: number;
  uptime: number;
  throughput24h: number;
  lastIncident: string | null;
}

export interface AttestationReport {
  auditorName: string;
  auditorLicenseId: string;
  methodology: string;
  reportHash: string;
  certificationStatus: "verified" | "pending_review" | "expired" | "revoked";
  scopeSummary: string;
  engagementPeriodStart: string;
  engagementPeriodEnd: string;
  nextScheduledAudit: string;
  reportUrl: string;
  signedBy: string;
  signedAt: string;
  findings: Array<{
    id: string;
    severity: "info" | "low" | "medium" | "high" | "critical";
    title: string;
    status: "resolved" | "open" | "acknowledged";
  }>;
}

export interface ReserveSnapshot {
  updatedAt: string;
  offChain: Array<{
    id: string;
    custodian: string;
    account: string;
    currency: string;
    balance: number;
  }>;
  onChain: Array<{
    id: string;
    token: string;
    network: string;
    circulatingSupply: number;
  }>;
  totalOffChain: number;
  totalOnChain: number;
  collateralizationRatio: number;
  attestationBy: string;
  attestation?: AttestationReport;
}

/* ------------------------------------------------------------------ */
/* Safe coercion helpers — never throw on an unexpected payload shape. */
/* ------------------------------------------------------------------ */

type Dict = Record<string, unknown>;

const asDict = (v: unknown): Dict => (v && typeof v === "object" ? (v as Dict) : {});
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Reads the first key present, supporting snake_case and camelCase spellings. */
function pick(src: Dict, ...keys: string[]): unknown {
  for (const k of keys) {
    if (src[k] !== undefined && src[k] !== null) return src[k];
  }
  return undefined;
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v === undefined || v === null ? fallback : String(v);
}

function bool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["true", "1", "yes"].includes(v.toLowerCase());
  return fallback;
}

/** Backends may return a bare array or { data: [...] } / { items: [...] }. */
function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const d = asDict(payload);
  for (const key of ["data", "items", "results", "rows", "rails", "ledger"]) {
    if (Array.isArray(d[key])) return d[key] as unknown[];
  }
  return [];
}

const LEDGER_STATUSES: LedgerStatus[] = ["settled", "pending", "failed", "processing"];

export function normalizeLedgerRow(raw: unknown, index: number): LedgerRow {
  const r = asDict(raw);
  const status = str(pick(r, "status", "global_status", "globalStatus"), "pending").toLowerCase();
  return {
    id: str(pick(r, "id", "transaction_id", "transactionId", "tx_id"), `TX-${index + 1}`),
    status: (LEDGER_STATUSES.includes(status as LedgerStatus)
      ? status
      : "pending") as LedgerStatus,
    date: str(pick(r, "date", "created_at", "timestamp", "settled_at")),
    amount: num(pick(r, "amount", "amount_usd", "value")),
    currency: str(pick(r, "currency", "asset", "ccy"), "XSGD"),
    sourceRail: str(pick(r, "source_rail", "sourceRail", "from_rail"), "—"),
    destinationRail: str(pick(r, "destination_rail", "destinationRail", "to_rail"), "—"),
    counterparty: str(pick(r, "counterparty", "counter_party", "partner"), "—"),
    direction:
      str(pick(r, "direction", "rail_direction"), "fiat").toLowerCase() === "crypto"
        ? "crypto"
        : "fiat",
    fxRate: num(pick(r, "fx_rate", "fxRate", "rate"), 1),
    fxLockedUntil: str(pick(r, "fx_locked_until", "fxLockedUntil", "rate_lock_expiry")),
    gasCost: num(pick(r, "gas_cost", "gasCost", "gas_fee")),
    gasCurrency: str(pick(r, "gas_currency", "gasCurrency"), "ETH"),
    networkFee: num(pick(r, "network_fee", "networkFee", "fee")),
    requiresApproval: bool(pick(r, "requires_approval", "requiresApproval", "needs_approval")),
  };
}

export function normalizeRail(raw: unknown, index: number): RailHealth {
  const r = asDict(raw);
  const status = str(pick(r, "status", "health", "state"), "operational").toLowerCase();
  const type = str(pick(r, "type", "rail_type", "category"), "bank").toLowerCase();
  let uptime = num(pick(r, "uptime", "uptime_pct", "uptimePct", "uptime_percent"), 99.9);
  if (uptime > 0 && uptime <= 1) uptime *= 100;
  return {
    id: str(pick(r, "id", "rail_id", "code", "name"), `rail-${index}`),
    name: str(pick(r, "name", "rail_name", "display_name"), "Unknown rail"),
    type: type.includes("chain") || type.includes("crypto") ? "chain" : "bank",
    region: str(pick(r, "region", "jurisdiction", "country"), "—"),
    status: (["operational", "degraded", "paused", "down"].includes(status)
      ? status
      : "operational") as RailHealth["status"],
    latencyMs: num(pick(r, "latency_ms", "latencyMs", "latency")),
    uptime,
    throughput24h: num(pick(r, "throughput_24h", "throughput24h", "volume_24h")),
    lastIncident: (() => {
      const v = pick(r, "last_incident", "lastIncident", "last_incident_at");
      return v === undefined ? null : str(v);
    })(),
  };
}

export function normalizeReserves(raw: unknown): ReserveSnapshot {
  const r = asDict(raw);
  const offChain = asArray(pick(r, "off_chain", "offChain", "bank_balances")).map((item, i) => {
    const o = asDict(item);
    return {
      id: str(pick(o, "id", "account_id"), `bank-${i}`),
      custodian: str(pick(o, "custodian", "bank", "bank_name"), "—"),
      account: str(pick(o, "account", "account_name", "account_number"), "—"),
      currency: str(pick(o, "currency", "ccy"), "SGD"),
      balance: num(pick(o, "balance", "amount", "safeguarded_balance")),
    };
  });
  const onChain = asArray(pick(r, "on_chain", "onChain", "token_supply")).map((item, i) => {
    const o = asDict(item);
    return {
      id: str(pick(o, "id", "token_id"), `token-${i}`),
      token: str(pick(o, "token", "symbol", "asset"), "XSGD"),
      network: str(pick(o, "network", "chain", "blockchain"), "—"),
      circulatingSupply: num(pick(o, "circulating_supply", "circulatingSupply", "supply")),
    };
  });

  const totalOffChain = num(
    pick(r, "total_off_chain", "totalOffChain", "total_reserves"),
    offChain.reduce((s, a) => s + a.balance, 0),
  );
  const totalOnChain = num(
    pick(r, "total_on_chain", "totalOnChain", "total_supply"),
    onChain.reduce((s, a) => s + a.circulatingSupply, 0),
  );
  let ratio = num(
    pick(r, "collateralization_ratio", "collateralizationRatio", "ratio"),
    totalOnChain > 0 ? (totalOffChain / totalOnChain) * 100 : 0,
  );
  if (ratio > 0 && ratio <= 2) ratio *= 100;

  const attestationRaw = asDict(pick(r, "attestation", "attestation_report") ?? {});
  const hasAttestationData = Object.keys(attestationRaw).length > 0;
  const findingsRaw = asArray(pick(attestationRaw, "findings", "audit_findings"));
  const SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
  const FINDING_STATUSES = ["resolved", "open", "acknowledged"] as const;
  const CERT_STATUSES = ["verified", "pending_review", "expired", "revoked"] as const;

  const certStatus = str(pick(attestationRaw, "certification_status", "certificationStatus"), "verified").toLowerCase();

  const attestation: AttestationReport | undefined = hasAttestationData ? {
    auditorName: str(pick(attestationRaw, "auditor_name", "auditorName"), "Example Assurance Firm"),
    auditorLicenseId: str(pick(attestationRaw, "auditor_license_id", "auditorLicenseId"), "EXAMPLE-0000"),
    methodology: str(pick(attestationRaw, "methodology"), "Example agreed-upon procedures"),
    reportHash: str(pick(attestationRaw, "report_hash", "reportHash"), "0x0000…0000"),
    certificationStatus: (CERT_STATUSES.includes(certStatus as typeof CERT_STATUSES[number]) ? certStatus : "verified") as AttestationReport["certificationStatus"],
    scopeSummary: str(pick(attestationRaw, "scope_summary", "scopeSummary"), "Example scope description"),
    engagementPeriodStart: str(pick(attestationRaw, "engagement_period_start", "engagementPeriodStart"), ""),
    engagementPeriodEnd: str(pick(attestationRaw, "engagement_period_end", "engagementPeriodEnd"), ""),
    nextScheduledAudit: str(pick(attestationRaw, "next_scheduled_audit", "nextScheduledAudit"), ""),
    reportUrl: str(pick(attestationRaw, "report_url", "reportUrl"), "#"),
    signedBy: str(pick(attestationRaw, "signed_by", "signedBy"), "Example Signing Partner"),
    signedAt: str(pick(attestationRaw, "signed_at", "signedAt"), ""),
    findings: findingsRaw.map((f, i) => {
      const fd = asDict(f);
      const sev = str(pick(fd, "severity"), "info").toLowerCase();
      const fStatus = str(pick(fd, "status"), "resolved").toLowerCase();
      return {
        id: str(pick(fd, "id"), `FND-${i + 1}`),
        severity: (SEVERITIES.includes(sev as typeof SEVERITIES[number]) ? sev : "info") as AttestationReport["findings"][number]["severity"],
        title: str(pick(fd, "title", "description"), "Example finding"),
        status: (FINDING_STATUSES.includes(fStatus as typeof FINDING_STATUSES[number]) ? fStatus : "resolved") as AttestationReport["findings"][number]["status"],
      };
    }),
  } : undefined;

  return {
    updatedAt: str(pick(r, "updated_at", "updatedAt", "timestamp"), new Date().toISOString()),
    offChain,
    onChain,
    totalOffChain,
    totalOnChain,
    collateralizationRatio: ratio,
    attestationBy: str(pick(r, "attestation_by", "attestationBy", "auditor"), attestation?.auditorName ?? "Independent auditor"),
    ...(attestation ? { attestation } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* Fetching                                                            */
/* ------------------------------------------------------------------ */

export async function fetchJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  signal?.addEventListener("abort", () => controller.abort());
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${path} responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export { unwrapList };
