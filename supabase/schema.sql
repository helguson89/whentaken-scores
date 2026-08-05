-- Run this in the Supabase SQL editor for your project.

create extension if not exists pgcrypto;

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  puzzle_number integer not null,
  puzzle_date date not null,
  total_score integer not null,
  total_max integer not null,
  rounds jsonb not null,
  raw_text text not null,
  created_at timestamptz not null default now(),
  unique (player_name, puzzle_number)
);

alter table public.scores enable row level security;

-- No login system: anyone with the app link can read and submit scores
-- for any player name. This trades security for simplicity, matching a
-- small trusted group of friends. Tighten these policies if that changes.
create policy "Public can read scores"
  on public.scores for select
  using (true);

create policy "Public can insert scores"
  on public.scores for insert
  with check (true);

create policy "Public can update scores (for resubmission)"
  on public.scores for update
  using (true)
  with check (true);
