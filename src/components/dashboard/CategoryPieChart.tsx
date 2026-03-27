"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type CategoryItem = {
  category: string;
  total: number;
};

type CategoryPieChartProps = {
  items: CategoryItem[];
};

const COLORS = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
  "#06B6D4",
  "#84CC16",
  "#EC4899",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function CategoryPieChart({ items }: CategoryPieChartProps) {
  const positiveItems = items.filter((item) => item.total > 0);
  const total = positiveItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <section className="rounded-2xl border bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-900">Category breakdown</h2>
      {positiveItems.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-600">No positive spending data for chart.</p>
      ) : (
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(260px,1fr)_minmax(260px,1fr)]">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={positiveItems}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {positiveItems.map((item, index) => (
                    <Cell
                      key={item.category}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name, payload) => {
                    const row = payload?.payload as CategoryItem | undefined;
                    if (!row || total <= 0) return formatCurrency(value);
                    const pct = Math.round((row.total / total) * 100);
                    return [`${formatCurrency(row.total)} (${pct}%)`, row.category];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="space-y-2 self-center text-sm text-zinc-700">
            {positiveItems.map((item, index) => {
              const color = COLORS[index % COLORS.length];
              const ratio = total > 0 ? Math.round((item.total / total) * 100) : 0;
              return (
                <li key={item.category} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{item.category}</span>
                  </div>
                  <span className="shrink-0 text-zinc-500">
                    {formatCurrency(item.total)} ({ratio}%)
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
