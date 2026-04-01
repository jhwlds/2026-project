alter table public.statements
add column if not exists bank text not null default 'chase-us';

alter table public.statements
drop constraint if exists statements_bank_check;

alter table public.statements
add constraint statements_bank_check
check (bank in ('chase-us', 'uccu'));
