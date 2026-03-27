import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { StatementDeleteButton } from "@/components/statements/StatementDeleteButton";
import { TransactionsByCategory } from "@/components/transactions/TransactionsByCategory";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { computeCategoryBreakdown, computeStatementMetrics } from "@/lib/reporting/metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StatementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: statement } = await supabase
    .from("statements")
    .select("id,file_name,statement_month,statement_year,processing_status")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id,date,merchant_raw,amount,category,subcategory,confidence_score")
    .eq("statement_id", id)
    .eq("user_id", user!.id)
    .order("date", { ascending: false });

  const rows = transactions ?? [];
  const metrics = computeStatementMetrics(rows);
  const categoryBreakdown = computeCategoryBreakdown(rows);
  const topCategoryBreakdown = categoryBreakdown.slice(0, 5);
  const topCategorySpend = topCategoryBreakdown[0]?.total ?? 0;
  const topCategoryShare =
    metrics.totalSpent > 0 ? Math.round((topCategorySpend / metrics.totalSpent) * 100) : 0;
  const positiveTxCount = rows.filter((row) => row.amount > 0).length;
  const negativeTxCount = rows.length - positiveTxCount;
  const summaryLines =
    rows.length === 0
      ? ["No transactions found for this statement yet."]
      : [
          `Total spend is ${formatCurrency(metrics.totalSpent)} across ${positiveTxCount} purchase${positiveTxCount === 1 ? "" : "s"}.`,
          `Top spending category is ${metrics.topCategory} at ${formatCurrency(topCategorySpend)} (${topCategoryShare}% of total).`,
          `Largest single transaction is ${formatCurrency(metrics.largestTransaction)}.${negativeTxCount > 0 ? ` There are ${negativeTxCount} refund/credit transaction${negativeTxCount === 1 ? "" : "s"}.` : ""}`,
        ];

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              {statement
                ? `${statement.statement_month}/${statement.statement_year} - ${statement.file_name}`
                : "Statement"}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Status: {statement?.processing_status ?? "Not found"}
            </p>
          </div>
          {statement ? (
            <StatementDeleteButton
              statementId={statement.id}
              afterDeleteHref="/statements"
            />
          ) : null}
        </div>
      </section>

      <SummaryCards
        totalSpent={metrics.totalSpent}
        transactionCount={metrics.transactionCount}
        topCategory={metrics.topCategory}
        largestTransaction={metrics.largestTransaction}
      />

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-semibold text-zinc-900">Monthly summary</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          {summaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          Mock summary is generated from parsed transaction metrics only.
        </p>
      </section>

      <CategoryPieChart items={categoryBreakdown} />

      <TransactionsByCategory rows={rows} />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">Transactions</h2>
        <TransactionsTable rows={rows} />
      </section>
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
