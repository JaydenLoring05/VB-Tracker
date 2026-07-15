-- Volleyball Tracker V18 schema
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Safe to re-run: every statement is guarded with "if not exists" / "or replace".

create table if not exists public.exercise_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week int not null,
  day text not null,
  exercise text not null,
  checked boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, week, day, exercise)
);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week int not null,
  day text not null,
  exercise text not null,
  value text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, week, day, exercise)
);

create table if not exists public.workout_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week int not null,
  day text not null,
  note text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, week, day)
);

-- One row per user: the current values shown in the Stats form / Dashboard
-- recovery card. Distinct from stats_history so "Clear History" can wipe
-- the chart data without blanking today's entry.
create table if not exists public.latest_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  date text,
  vertical numeric,
  approach numeric,
  weight numeric,
  pullups numeric,
  sleep numeric,
  knee_pain numeric,
  shoulder_pain numeric,
  soreness numeric,
  energy numeric,
  updated_at timestamptz not null default now()
);

create table if not exists public.stats_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date text,
  vertical numeric,
  approach numeric,
  weight numeric,
  pullups numeric,
  sleep numeric,
  knee_pain numeric,
  shoulder_pain numeric,
  soreness numeric,
  energy numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  type text not null check (type in ('workout', 'practice', 'game', 'recovery', 'rest')),
  title text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.prs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  exercise text not null,
  value text not null,
  unit text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.exercise_checks enable row level security;
alter table public.workout_logs enable row level security;
alter table public.workout_notes enable row level security;
alter table public.latest_stats enable row level security;
alter table public.stats_history enable row level security;
alter table public.calendar_events enable row level security;
alter table public.prs enable row level security;

drop policy if exists "own rows" on public.exercise_checks;
create policy "own rows" on public.exercise_checks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.workout_logs;
create policy "own rows" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.workout_notes;
create policy "own rows" on public.workout_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.latest_stats;
create policy "own rows" on public.latest_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.stats_history;
create policy "own rows" on public.stats_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.calendar_events;
create policy "own rows" on public.calendar_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.prs;
create policy "own rows" on public.prs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
