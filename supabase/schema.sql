create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  description text not null check (
    char_length(btrim(description)) between 1 and 80
  ),
  amount numeric(12, 2) not null check (amount > 0),
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

alter table public.transactions enable row level security;

revoke all on table public.transactions from public, anon, authenticated;
grant select, insert on table public.transactions to authenticated;

drop policy if exists "Users can read their own transactions"
  on public.transactions;
create policy "Users can read their own transactions"
  on public.transactions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own transactions"
  on public.transactions;
create policy "Users can add their own transactions"
  on public.transactions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
