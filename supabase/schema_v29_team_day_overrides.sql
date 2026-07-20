-- Volleyball Tracker V29 schema (team full-day program overrides, paid tier)
-- Run this once in the Supabase SQL Editor, after schema_v28_team_exercise_defaults.sql.
-- Safe to re-run.

create table if not exists public.team_day_overrides (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  phase text not null check (phase in ('foundation', 'build', 'power', 'taper')),
  day text not null,
  exercises text[] not null,
  updated_at timestamptz not null default now(),
  unique (team_id, phase, day)
);

alter table public.team_day_overrides enable row level security;

drop policy if exists "team members can view day overrides" on public.team_day_overrides;
create policy "team members can view day overrides" on public.team_day_overrides
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_day_overrides.team_id
        and team_members.user_id = auth.uid()
    )
  );

-- Gated to plan_tier = 'paid' at the RLS layer, not just hidden in the UI --
-- a free-tier coach's client can't write here even if they bypass the UI.
drop policy if exists "paid coach can manage day overrides" on public.team_day_overrides;
create policy "paid coach can manage day overrides" on public.team_day_overrides
  for all using (
    public.is_team_coach(team_day_overrides.team_id)
    and exists (
      select 1 from public.teams
      where teams.id = team_day_overrides.team_id and teams.plan_tier = 'paid'
    )
  ) with check (
    public.is_team_coach(team_day_overrides.team_id)
    and exists (
      select 1 from public.teams
      where teams.id = team_day_overrides.team_id and teams.plan_tier = 'paid'
    )
  );
