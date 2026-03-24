import type { CategorizedTransaction } from "@/types/domain";

export type StatementMetrics = {
  totalSpent: number;
  transactionCount: number;
  topCategory: string;
  largestTransaction: number;
};

export function computeStatementMetrics(
  transactions: Pick<CategorizedTransaction, "amount" | "category">[],
): StatementMetrics {
  const totalSpent = round2(
    transactions.reduce((sum, tx) => (tx.amount > 0 ? sum + tx.amount : sum), 0),
  );
  const transactionCount = transactions.length;
  const largestTransaction = round2(
    transactions.reduce((max, tx) => Math.max(max, tx.amount), 0),
  );

  const categoryTotals = new Map<string, number>();
  for (const tx of transactions) {
    const prev = categoryTotals.get(tx.category) ?? 0;
    categoryTotals.set(tx.category, prev + tx.amount);
  }

  let topCategory = "N/A";
  let topAmount = Number.NEGATIVE_INFINITY;
  for (const [category, amount] of categoryTotals.entries()) {
    if (amount > topAmount) {
      topAmount = amount;
      topCategory = category;
    }
  }

  return { totalSpent, transactionCount, topCategory, largestTransaction };
}

export function computeCategoryBreakdown(
  transactions: Pick<CategorizedTransaction, "amount" | "category">[],
) {
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    const prev = totals.get(tx.category) ?? 0;
    totals.set(tx.category, prev + tx.amount);
  }

  return [...totals.entries()]
    .map(([category, total]) => ({ category, total: round2(total) }))
    .sort((a, b) => b.total - a.total);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
