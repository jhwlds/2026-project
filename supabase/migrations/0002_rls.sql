alter table public.statements enable row level security;
alter table public.transactions enable row level security;
alter table public.merchant_mappings enable row level security;

drop policy if exists statements_owner_only on public.statements;
create policy statements_owner_only
  on public.statements
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists transactions_owner_only on public.transactions;
create policy transactions_owner_only
  on public.transactions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists merchant_mappings_owner_only on public.merchant_mappings;
create policy merchant_mappings_owner_only
  on public.merchant_mappings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
