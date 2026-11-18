import { createServerFn } from "@tanstack/react-start";
import { getLedger, updateTransaction } from "./ledger-store";
import { sendCCIPMessage } from "./ccip-sender";

/**
 * GET /api/ledger — returns current ledger from server store
 */
export const getServerLedger = createServerFn({ method: "GET" }).handler(async () => {
  return getLedger();
});

/**
 * POST approve transaction — triggers CCIP send if wallet is configured
 */
export const approveServerTransaction = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const updated = updateTransaction(data.id, {
      status: "processing" as const,
      requiresApproval: false,
      date: new Date().toISOString(),
    });
    if (!updated) return { success: false, error: "Transaction not found" };

    // Attempt real CCIP transfer via Sepolia Router
    const ccipResult = await sendCCIPMessage(data.id);

    if (ccipResult.success) {
      updateTransaction(data.id, {
        status: "settled" as const,
        ccipMessageId: ccipResult.messageId || "",
        ccipExecutionState: "Success",
        date: new Date().toISOString(),
      });
    } else {
      // Settle locally if CCIP wallet is not configured / funded
      updateTransaction(data.id, {
        status: "settled" as const,
        date: new Date().toISOString(),
      });
    }

    return {
      success: true,
      ccip: ccipResult,
      transaction: getLedger().find((tx) => tx.id === data.id),
    };
  });

/**
 * POST reject transaction
 */
export const rejectServerTransaction = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const updated = updateTransaction(data.id, {
      status: "failed" as const,
      requiresApproval: false,
    });
    return { success: !!updated };
  });
