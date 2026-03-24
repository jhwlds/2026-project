type TransactionRow = {
  id: string;
  date: string;
  merchant_raw: string;
  amount: number;
  category: string;
  subcategory: string | null;
  confidence_score: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function TransactionsTable({ rows }: { rows: TransactionRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-600">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Merchant</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-100">
              <td className="px-4 py-3 text-zinc-700">{row.date}</td>
              <td className="px-4 py-3 text-zinc-900">{row.merchant_raw}</td>
              <td className="px-4 py-3 text-zinc-900">{formatCurrency(row.amount)}</td>
              <td className="px-4 py-3 text-zinc-700">
                {row.category}
                {row.subcategory ? ` / ${row.subcategory}` : ""}
              </td>
              <td className="px-4 py-3 text-zinc-500">
                {(row.confidence_score * 100).toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
