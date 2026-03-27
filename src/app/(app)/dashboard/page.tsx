import Link from "next/link";

import { MonthlyAnalyticsCharts } from "@/components/dashboard/MonthlyAnalyticsCharts";
import { buildDashboardAnalytics } from "@/lib/reporting/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("date,amount,category")
    .eq("user_id", user!.id)
    .order("date", { ascending: true });

  const analytics = buildDashboardAnalytics(transactions ?? []);
  const hasData = analytics.monthlyTotals.length > 0;

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Monthly analytics dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Focus on month-over-month spend trends and category mix.
            </p>
          </div>
          <Link
            href="/statements"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Go to statements
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Months tracked</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {analytics.insights.monthsTracked}
          </p>
        </article>
        <article className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Average monthly spend</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {formatCurrency(analytics.insights.avgMonthlySpend)}
          </p>
        </article>
        <article className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Latest month spend</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {formatCurrency(analytics.insights.latestMonthSpend)}
          </p>
          <p
            className={`mt-1 text-xs ${
              analytics.insights.momDelta > 0
                ? "text-red-600"
                : analytics.insights.momDelta < 0
                  ? "text-emerald-600"
                  : "text-zinc-500"
            }`}
          >
            {analytics.insights.prevMonthSpend > 0
              ? `${analytics.insights.momDelta > 0 ? "+" : ""}${analytics.insights.momDelta}% vs previous month`
              : "Need at least 2 months to compare"}
          </p>
        </article>
        <article className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Highest spend month</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{analytics.insights.highestMonth}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {formatCurrency(analytics.insights.highestMonthSpend)}
          </p>
        </article>
      </section>

      {hasData ? (
        <MonthlyAnalyticsCharts
          monthlyTotals={analytics.monthlyTotals}
          monthlyCategorySeries={analytics.monthlyCategorySeries}
          topCategories={analytics.topCategories}
        />
      ) : (
        <section className="rounded-2xl border bg-white p-6 text-sm text-zinc-600">
          No spending data yet. Upload at least one statement from the Statements page.
        </section>
      )}
    </main>
  );
}
