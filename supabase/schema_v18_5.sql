-- Volleyball Tracker V18.5 schema (Workout Mode)
-- Run this once in the Supabase SQL Editor, after schema.sql.
-- Safe to re-run.

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week int not null,
  day text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise text not null,
  set_number int not null,
  weight numeric,
  reps numeric,
  created_at timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

drop policy if exists "own rows" on public.workout_sessions;
create policy "own rows" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.workout_sets;
create policy "own rows" on public.workout_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
