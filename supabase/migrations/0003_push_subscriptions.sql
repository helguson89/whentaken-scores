-- Incremental migration: adds push notification support (comments + new
-- scores). Run this once in the SQL Editor if you already applied
-- schema.sql and/or 0002_comments_and_reactions.sql.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Public can read push subscriptions"
  on public.push_subscriptions for select
  using (true);

create policy "Public can insert push subscriptions"
  on public.push_subscriptions for insert
  with check (true);

create policy "Public can update push subscriptions (re-subscribe)"
  on public.push_subscriptions for update
  using (true)
  with check (true);

create policy "Public can delete push subscriptions (unsubscribe)"
  on public.push_subscriptions for delete
  using (true);
