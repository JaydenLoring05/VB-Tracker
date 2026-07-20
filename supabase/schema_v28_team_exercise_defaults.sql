-- Volleyball Tracker V28 schema (team-wide exercise defaults, free tier)
-- Run this once in the Supabase SQL Editor, after schema_v27_team_plan_tier.sql.
-- Safe to re-run.

create table if not exists public.team_exercise_defaults (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  original_exercise text not null,
  chosen_exercise text not null,
  updated_at timestamptz not null default now(),
  unique (team_id, original_exercise)
);

alter table public.team_exercise_defaults enable row level security;

drop policy if exists "team members can view team defaults" on public.team_exercise_defaults;
create policy "team members can view team defaults" on public.team_exercise_defaults
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_exercise_defaults.team_id
        and team_members.user_id = auth.uid()
    )
  );

drop policy if exists "coach can manage team defaults" on public.team_exercise_defaults;
create policy "coach can manage team defaults" on public.team_exercise_defaults
  for all using (
    public.is_team_coach(team_exercise_defaults.team_id)
  ) with check (
    public.is_team_coach(team_exercise_defaults.team_id)
  );
