type SummaryCardsProps = {
  totalSpent: number;
  transactionCount: number;
  topCategory: string;
  largestTransaction: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function SummaryCards(props: SummaryCardsProps) {
  const cards = [
    { label: "Total spent", value: formatCurrency(props.totalSpent) },
    { label: "Transactions", value: String(props.transactionCount) },
    { label: "Top category", value: props.topCategory },
    { label: "Largest transaction", value: formatCurrency(props.largestTransaction) },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-zinc-500">{card.label}</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
