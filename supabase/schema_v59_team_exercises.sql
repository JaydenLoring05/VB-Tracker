-- Volleyball Tracker V59 schema (a coach's own exercises in the Exercise Library, F-22)
-- Run this once in the Supabase SQL Editor, after schema_v58_weekly_schedule.sql.
-- Safe to re-run.
--
-- A coach adds an exercise that isn't in the built-in library (name, what
-- it's for, coaching cues, an optional video link, reps or time). Everyone
-- on the team can read it, so athletes can look it up in the library and
-- see its cues in Workout Mode. Only the team's coach can add, edit or
-- delete one. Until this file is run, the library shows only the built-in
-- exercises and a coach sees a note that this setup step is missing.

create table if not exists public.team_exercises (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  category text not null check (
    category in (
      'Jump Development',
      'Landing Mechanics',
      'Knee Strength',
      'Shoulder Health',
      'Hitting Power',
      'Rotational Core',
      'Speed & Agility',
      'Volleyball Conditioning',
      'Mobility',
      'Recovery'
    )
  ),
  purpose text check (purpose is null or char_length(purpose) <= 280),
  cues text[] not null default '{}' check (
    cardinality(cues) <= 8 and char_length(array_to_string(cues, '')) <= 1200
  ),
  video_url text check (
    video_url is null or (video_url ~* '^https://' and char_length(video_url) <= 500)
  ),
  measure text not null default 'reps' check (measure in ('reps', 'time')),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One exercise per name per team, ignoring case and outer spaces.
create unique index if not exists team_exercises_team_name_idx
  on public.team_exercises (team_id, lower(btrim(name)));

alter table public.team_exercises enable row level security;

-- is_team_member() is from schema_v41_team_member_names.sql.
drop policy if exists "team members can view team exercises" on public.team_exercises;
create policy "team members can view team exercises" on public.team_exercises
  for select using (public.is_team_member(team_exercises.team_id));

-- is_team_coach() is from schema_v20_teams.sql.
drop policy if exists "coach can manage team exercises" on public.team_exercises;
create policy "coach can manage team exercises" on public.team_exercises
  for all using (
    public.is_team_coach(team_exercises.team_id)
  ) with check (
    public.is_team_coach(team_exercises.team_id)
  );
