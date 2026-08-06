-- Incremental migration: run this if you already applied the original
-- schema.sql (which only had the `scores` table). Safe to run once.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  puzzle_number integer not null,
  player_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  score_id uuid not null references public.scores (id) on delete cascade,
  player_name text not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (score_id, player_name, emoji)
);

alter table public.reactions enable row level security;

create policy "Public can read comments"
  on public.comments for select
  using (true);

create policy "Public can insert comments"
  on public.comments for insert
  with check (true);

create policy "Public can read reactions"
  on public.reactions for select
  using (true);

create policy "Public can insert reactions"
  on public.reactions for insert
  with check (true);

create policy "Public can delete reactions (for un-reacting)"
  on public.reactions for delete
  using (true);
