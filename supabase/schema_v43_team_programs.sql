-- Volleyball Tracker V43 schema (coach-built programs)
-- Run this once in the Supabase SQL Editor, after schema_v42_workout_set_seconds.sql.
-- Safe to re-run.
--
-- A coach builds their own repeating week (team_programs.days), then assigns
-- it to the whole team, a group of athletes (team_groups), or one athlete.
-- The athlete's app uses the most specific assignment: athlete, then group,
-- then team. Athletes with no assignment stay on the recommended plan.

create table if not exists public.team_programs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  -- [{ day, title, notes, rest, minutes, exercises: [{ name, sets, reps, seconds }] }]
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_programs_team_id_idx on public.team_programs (team_id);

create table if not exists public.team_groups (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (team_id, name)
);

create table if not exists public.team_group_members (
  group_id uuid not null references public.team_groups (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (group_id, user_id)
);

create table if not exists public.team_program_assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  program_id uuid not null references public.team_programs (id) on delete cascade,
  scope text not null check (scope in ('team', 'group', 'athlete')),
  group_id uuid references public.team_groups (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now(),
  check (
    (scope = 'team' and group_id is null and user_id is null)
    or (scope = 'group' and group_id is not null and user_id is null)
    or (scope = 'athlete' and user_id is not null and group_id is null)
  )
);

-- One assignment per target: one team-wide program, one per group, one per athlete.
create unique index if not exists team_program_assignments_team_scope
  on public.team_program_assignments (team_id) where scope = 'team';
create unique index if not exists team_program_assignments_group_scope
  on public.team_program_assignments (group_id) where scope = 'group';
create unique index if not exists team_program_assignments_athlete_scope
  on public.team_program_assignments (team_id, user_id) where scope = 'athlete';

alter table public.team_programs enable row level security;
alter table public.team_groups enable row level security;
alter table public.team_group_members enable row level security;
alter table public.team_program_assignments enable row level security;

-- Any member of the team can read (athletes need their program and groups).
drop policy if exists "team members can view programs" on public.team_programs;
create policy "team members can view programs" on public.team_programs
  for select using (
    exists (select 1 from public.team_members
            where team_members.team_id = team_programs.team_id and team_members.user_id = auth.uid())
  );

drop policy if exists "team members can view groups" on public.team_groups;
create policy "team members can view groups" on public.team_groups
  for select using (
    exists (select 1 from public.team_members
            where team_members.team_id = team_groups.team_id and team_members.user_id = auth.uid())
  );

drop policy if exists "team members can view group members" on public.team_group_members;
create policy "team members can view group members" on public.team_group_members
  for select using (
    exists (select 1 from public.team_members
            where team_members.team_id = team_group_members.team_id and team_members.user_id = auth.uid())
  );

drop policy if exists "team members can view assignments" on public.team_program_assignments;
create policy "team members can view assignments" on public.team_program_assignments
  for select using (
    exists (select 1 from public.team_members
            where team_members.team_id = team_program_assignments.team_id and team_members.user_id = auth.uid())
  );

-- Only the team's coach can write. Open to every plan tier for now; to make
-- this paid-only, add the same plan_tier check schema_v29 uses.
drop policy if exists "coach can manage programs" on public.team_programs;
create policy "coach can manage programs" on public.team_programs
  for all using (public.is_team_coach(team_id)) with check (public.is_team_coach(team_id));

drop policy if exists "coach can manage groups" on public.team_groups;
create policy "coach can manage groups" on public.team_groups
  for all using (public.is_team_coach(team_id)) with check (public.is_team_coach(team_id));

drop policy if exists "coach can manage group members" on public.team_group_members;
create policy "coach can manage group members" on public.team_group_members
  for all using (public.is_team_coach(team_id))
  with check (
    public.is_team_coach(team_id)
    and exists (select 1 from public.team_groups g where g.id = group_id and g.team_id = team_group_members.team_id)
    and exists (select 1 from public.team_members m
                where m.team_id = team_group_members.team_id and m.user_id = team_group_members.user_id and m.role = 'athlete')
  );

drop policy if exists "coach can manage assignments" on public.team_program_assignments;
create policy "coach can manage assignments" on public.team_program_assignments
  for all using (public.is_team_coach(team_id))
  with check (
    public.is_team_coach(team_id)
    and exists (select 1 from public.team_programs p where p.id = program_id and p.team_id = team_program_assignments.team_id)
  );
