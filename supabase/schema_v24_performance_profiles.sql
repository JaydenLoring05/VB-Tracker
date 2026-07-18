-- Volleyball Tracker V24 schema (athlete performance profile)
-- Run this once in the Supabase SQL Editor, after schema_v20_teams.sql.
-- Safe to re-run.

create table if not exists public.performance_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  position text,
  height_in numeric,
  standing_reach_in numeric,
  approach_touch_in numeric,
  block_touch_in numeric,
  body_weight_lbs numeric,
  approach_vertical_in numeric generated always as (approach_touch_in - standing_reach_in) stored,
  updated_at timestamptz not null default now()
);

alter table public.performance_profiles enable row level security;

drop policy if exists "own performance profile" on public.performance_profiles;
create policy "own performance profile" on public.performance_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "own performance profile insert" on public.performance_profiles;
create policy "own performance profile insert" on public.performance_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "own performance profile update" on public.performance_profiles;
create policy "own performance profile update" on public.performance_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Coaches can view (read-only) their roster's performance profiles,
-- reusing the is_caller_coach_of() helper from schema_v20_teams.sql --
-- same pattern as schema_v22_profiles.sql's roster-visibility policy.
drop policy if exists "coach can view roster performance profiles" on public.performance_profiles;
create policy "coach can view roster performance profiles" on public.performance_profiles
  for select using (public.is_caller_coach_of(user_id));
