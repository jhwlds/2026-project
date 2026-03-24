import { StatementDeleteButton } from "@/components/statements/StatementDeleteButton";
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
  const categoryBreakdown = computeCategoryBreakdown(rows).slice(0, 5);

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
        <h2 className="text-lg font-semibold text-zinc-900">Monthly summary (mock)</h2>
        <p className="mt-2 text-sm text-zinc-700">
          This month you spent most on {metrics.topCategory}. Total spend is{" "}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(metrics.totalSpent)}
          . Full AI summary will be connected in the next step.
        </p>
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-semibold text-zinc-900">Top categories</h2>
        <ul className="mt-2 space-y-2 text-sm text-zinc-700">
          {categoryBreakdown.map((item) => (
            <li key={item.category} className="flex justify-between">
              <span>{item.category}</span>
              <span>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(item.total)}
              </span>
            </li>
          ))}
          {categoryBreakdown.length === 0 ? <li>No transactions yet.</li> : null}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">Transactions</h2>
        <TransactionsTable rows={rows} />
      </section>
    </main>
  );
}
