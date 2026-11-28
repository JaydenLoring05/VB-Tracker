-- NextRep V62 schema (jump PR tracking, G-04)
-- Run this once in the Supabase SQL Editor, after schema_v61_athlete_signup.sql.
-- Safe to re-run.
--
-- One row per logged jump: a vertical or an approach touch, in inches, on a
-- date. Kept apart from stats_history so logging a jump never counts as the
-- daily check-in. Older values typed into the stats form still live in
-- stats_history.vertical / .approach, and the app reads both.
--
-- Access: the athlete reads and writes their own rows; their coach can read
-- them (same pattern as every per-athlete table, see schema_v20).

create table if not exists public.jump_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tested_on date not null,
  kind text not null check (kind in ('vertical', 'approach')),
  value_in numeric(4, 1) not null check (value_in > 0 and value_in <= 200),
  created_at timestamptz not null default now()
);

create index if not exists jump_tests_user_kind_idx on public.jump_tests (user_id, kind, tested_on);

alter table public.jump_tests enable row level security;

drop policy if exists "own rows" on public.jump_tests;
create policy "own rows" on public.jump_tests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "coach can view roster jumps" on public.jump_tests;
create policy "coach can view roster jumps" on public.jump_tests
  for select using (public.is_caller_coach_of(user_id));

-- Check (should return true):
-- select to_regclass('public.jump_tests') is not null;
