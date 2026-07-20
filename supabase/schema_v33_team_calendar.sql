-- Volleyball Tracker V33 schema (team-wide coach calendar)
-- Run this once in the Supabase SQL Editor, after schema_v32_workout_rpe.sql.
-- Safe to re-run.

-- Separate from the existing personal calendar_events table (which stays
-- exactly as it is) -- these are coach-authored events that apply to the
-- whole roster and are layered on top of an athlete's personal calendar,
-- read-only to athletes.

create table if not exists public.team_calendar_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  date text not null,
  type text not null check (type in ('practice', 'match', 'tournament', 'travel', 'testing', 'playoffs')),
  title text not null,
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.team_calendar_events enable row level security;

drop policy if exists "team members can view team events" on public.team_calendar_events;
create policy "team members can view team events" on public.team_calendar_events
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_calendar_events.team_id
        and team_members.user_id = auth.uid()
    )
  );

-- Reuses is_team_coach() from schema_v20_teams.sql, already parameterized
-- by team_id.
drop policy if exists "coach can manage team events" on public.team_calendar_events;
create policy "coach can manage team events" on public.team_calendar_events
  for all using (
    public.is_team_coach(team_calendar_events.team_id)
  ) with check (
    public.is_team_coach(team_calendar_events.team_id)
  );
