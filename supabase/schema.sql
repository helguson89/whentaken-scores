-- Full schema for a fresh Supabase project. Run this once in the SQL Editor.
-- If you already ran an earlier version of this file, don't re-run it whole
-- (the CREATE POLICY statements aren't idempotent) — instead run the files
-- under supabase/migrations/ that you haven't applied yet.

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

-- No login system: anyone with the app link can read and write as any
-- player name. This trades security for simplicity, matching a small
-- trusted group of friends. Tighten these policies if that changes.

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
