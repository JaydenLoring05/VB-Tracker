-- Volleyball Tracker V22 schema (per-user activity tracking)
-- Run this once in the Supabase SQL Editor, after schema_v20_teams.sql.
-- Safe to re-run.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_active_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can see and touch their own profile row.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Coaches can see (read-only) the last-active timestamp for athletes on
-- their own roster, reusing the is_caller_coach_of() helper from
-- schema_v20_teams.sql. Postgres OR's this together with the "own profile"
-- policy above, so an athlete's own read/write access is unaffected.
drop policy if exists "coach can view roster profiles" on public.profiles;
create policy "coach can view roster profiles" on public.profiles
  for select using (public.is_caller_coach_of(user_id));
