import { demoLedger } from "../apex-demo";
import { normalizeLedgerRow, type LedgerRow } from "../apex";

// Server-side in-memory store — seed data is clearly labeled
let ledger: LedgerRow[] = demoLedger.map(normalizeLedgerRow);

export function getLedger(): LedgerRow[] {
  return ledger;
}

export function updateTransaction(id: string, updates: Partial<LedgerRow>): LedgerRow | null {
  const idx = ledger.findIndex((tx) => tx.id === id);
  if (idx === -1) return null;
  ledger[idx] = { ...ledger[idx], ...updates };
  return ledger[idx];
}

export function addTransaction(tx: LedgerRow): void {
  ledger = [tx, ...ledger];
}
