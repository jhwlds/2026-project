type TransactionRow = {
  id: string;
  date: string;
  merchant_raw: string;
  amount: number;
  category: string;
  subcategory: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function TransactionsByCategory({ rows }: { rows: TransactionRow[] }) {
  const groups = buildGroups(rows);

  return (
    <section className="rounded-2xl border bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-900">Transactions by category</h2>
      {groups.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-600">No transactions yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {groups.map((group) => (
            <details key={group.category} className="group rounded-xl border border-zinc-200">
              <summary className="flex cursor-pointer list-none items-center justify-between bg-zinc-50 px-4 py-2">
                <p className="text-sm font-medium text-zinc-900">
                  <span className="mr-2 inline-block transition-transform group-open:rotate-90">
                    ▶
                  </span>
                  {group.category}{" "}
                  <span className="text-zinc-500">({group.transactions.length})</span>
                </p>
                <p className="text-sm font-semibold text-zinc-800">{formatCurrency(group.total)}</p>
              </summary>
              <ul className="divide-y divide-zinc-100">
                {group.transactions.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between gap-3 px-4 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-900">{tx.merchant_raw}</p>
                      <p className="text-xs text-zinc-500">
                        {tx.date}
                        {tx.subcategory ? ` · ${tx.subcategory}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-zinc-800">
                      {formatCurrency(tx.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

function buildGroups(rows: TransactionRow[]) {
  const grouped = new Map<
    string,
    { category: string; total: number; transactions: TransactionRow[] }
  >();

  for (const tx of rows) {
    const category = tx.category || "Uncategorized";
    const existing = grouped.get(category);
    if (existing) {
      existing.total += tx.amount;
      existing.transactions.push(tx);
      continue;
    }

    grouped.set(category, {
      category,
      total: tx.amount,
      transactions: [tx],
    });
  }

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      total: Math.round(group.total * 100) / 100,
      transactions: [...group.transactions].sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.total - a.total);
}
