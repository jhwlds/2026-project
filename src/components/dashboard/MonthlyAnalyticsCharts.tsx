"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  MonthlyCategoryPoint,
  MonthlyTotalPoint,
} from "@/lib/reporting/dashboard";

type Props = {
  monthlyTotals: MonthlyTotalPoint[];
  monthlyCategorySeries: MonthlyCategoryPoint[];
  topCategories: string[];
};

const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function MonthlyAnalyticsCharts({
  monthlyTotals,
  monthlyCategorySeries,
  topCategories,
}: Props) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <article className="rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-semibold text-zinc-900">Monthly spending trend</h2>
        <p className="mt-1 text-sm text-zinc-600">Track total spend month over month.</p>
        <div className="mt-3 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTotals}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line type="monotone" dataKey="total" stroke="#0f172a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-semibold text-zinc-900">Monthly category mix</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Stacked view for top categories by total spend.
        </p>
        <div className="mt-3 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyCategorySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              {topCategories.map((category, index) => (
                <Bar
                  key={category}
                  dataKey={category}
                  stackId="spend"
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
