type TxInput = {
  date: string;
  amount: number;
  category: string;
};

export type MonthlyTotalPoint = {
  month: string;
  label: string;
  total: number;
};

export type MonthlyCategoryPoint = {
  month: string;
  label: string;
} & Record<string, number | string>;

export type DashboardInsights = {
  monthsTracked: number;
  avgMonthlySpend: number;
  latestMonthSpend: number;
  prevMonthSpend: number;
  momDelta: number;
  highestMonth: string;
  highestMonthSpend: number;
};

export type DashboardAnalytics = {
  monthlyTotals: MonthlyTotalPoint[];
  monthlyCategorySeries: MonthlyCategoryPoint[];
  topCategories: string[];
  insights: DashboardInsights;
};

export function buildDashboardAnalytics(transactions: TxInput[]): DashboardAnalytics {
  const spendOnly = transactions.filter((tx) => tx.amount > 0);
  const monthTotals = new Map<string, number>();
  const monthCategoryTotals = new Map<string, Map<string, number>>();
  const categoryTotals = new Map<string, number>();

  for (const tx of spendOnly) {
    const month = tx.date.slice(0, 7);
    const category = tx.category || "Uncategorized";

    monthTotals.set(month, (monthTotals.get(month) ?? 0) + tx.amount);

    const categoryMap = monthCategoryTotals.get(month) ?? new Map<string, number>();
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + tx.amount);
    monthCategoryTotals.set(month, categoryMap);

    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + tx.amount);
  }

  const months = [...monthTotals.keys()].sort((a, b) => a.localeCompare(b));
  const monthlyTotals = months.map((month) => ({
    month,
    label: formatMonthLabel(month),
    total: round2(monthTotals.get(month) ?? 0),
  }));

  const topCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category]) => category);

  const monthlyCategorySeries = months.map((month) => {
    const categoryMap = monthCategoryTotals.get(month) ?? new Map<string, number>();
    const row: MonthlyCategoryPoint = {
      month,
      label: formatMonthLabel(month),
    };
    for (const category of topCategories) {
      row[category] = round2(categoryMap.get(category) ?? 0);
    }
    return row;
  });

  const insights = buildInsights(monthlyTotals);

  return {
    monthlyTotals,
    monthlyCategorySeries,
    topCategories,
    insights,
  };
}

function buildInsights(monthlyTotals: MonthlyTotalPoint[]): DashboardInsights {
  const monthsTracked = monthlyTotals.length;
  const total = monthlyTotals.reduce((sum, row) => sum + row.total, 0);
  const avgMonthlySpend = monthsTracked > 0 ? round2(total / monthsTracked) : 0;

  const latest = monthsTracked > 0 ? monthlyTotals[monthsTracked - 1] : null;
  const prev = monthsTracked > 1 ? monthlyTotals[monthsTracked - 2] : null;

  const latestMonthSpend = latest?.total ?? 0;
  const prevMonthSpend = prev?.total ?? 0;
  const momDelta =
    prevMonthSpend > 0 ? round2(((latestMonthSpend - prevMonthSpend) / prevMonthSpend) * 100) : 0;

  let highestMonth = "N/A";
  let highestMonthSpend = 0;
  for (const row of monthlyTotals) {
    if (row.total > highestMonthSpend) {
      highestMonth = row.label;
      highestMonthSpend = row.total;
    }
  }

  return {
    monthsTracked,
    avgMonthlySpend,
    latestMonthSpend,
    prevMonthSpend,
    momDelta,
    highestMonth,
    highestMonthSpend: round2(highestMonthSpend),
  };
}

function formatMonthLabel(month: string) {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number(yearRaw);
  const monthNum = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(monthNum)) return month;
  const date = new Date(Date.UTC(year, monthNum - 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
