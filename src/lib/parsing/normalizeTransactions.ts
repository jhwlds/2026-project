import type { NormalizedTransaction, ParsedTransaction } from "@/types/domain";

import { normalizeMerchantName } from "./normalizeMerchant";

export function normalizeTransactions(
  parsed: ParsedTransaction[],
): NormalizedTransaction[] {
  return parsed.map((tx) => {
    const amount = Number(tx.amount);
    if (!Number.isFinite(amount)) {
      throw new Error(`Invalid amount detected for merchant: ${tx.merchantRaw}`);
    }

    return {
      date: tx.date,
      merchant_raw: tx.merchantRaw.trim(),
      merchant_normalized: normalizeMerchantName(tx.merchantRaw),
      amount,
    };
  });
}
