create extension if not exists pgcrypto;

create type processing_status as enum (
  'uploaded',
  'parsing',
  'categorized',
  'completed',
  'failed'
);

create table if not exists public.statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  statement_month int not null check (statement_month between 1 and 12),
  statement_year int not null check (statement_year between 2000 and 2100),
  uploaded_at timestamptz not null default now(),
  processing_status processing_status not null default 'uploaded',
  parser_version text not null default 'chase-us-v1',
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  statement_id uuid not null references public.statements(id) on delete cascade,
  date date not null,
  merchant_raw text not null,
  merchant_normalized text not null,
  amount numeric(12, 2) not null,
  category text not null default 'Uncategorized',
  subcategory text,
  confidence_score numeric(4, 3) not null default 0.0,
  categorization_source text not null default 'rule',
  is_recurring boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.merchant_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_name text not null,
  category text not null,
  subcategory text,
  confidence numeric(4, 3) not null default 1.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, merchant_name)
);

create index if not exists idx_statements_user_period
  on public.statements(user_id, statement_year desc, statement_month desc, uploaded_at desc);

create index if not exists idx_transactions_statement
  on public.transactions(statement_id);

create index if not exists idx_transactions_user_date
  on public.transactions(user_id, date desc);

create index if not exists idx_transactions_user_merchant
  on public.transactions(user_id, merchant_normalized);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_merchant_mappings_updated_at on public.merchant_mappings;
create trigger trg_merchant_mappings_updated_at
before update on public.merchant_mappings
for each row
execute function public.update_updated_at_column();
