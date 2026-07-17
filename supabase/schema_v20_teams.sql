-- Volleyball Tracker V20 schema (Coach/Team layer)
-- Run this once in the Supabase SQL Editor, after schema.sql, schema_v18_5.sql,
-- and schema_v19.sql.
-- Safe to re-run.

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('coach', 'athlete')),
  display_name text,
  joined_at timestamptz not null default now(),
  unique (team_id, user_id),
  -- One team per user (as coach or athlete) for now.
  unique (user_id)
);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- SECURITY DEFINER helpers, owned by the migration-running role (postgres),
-- so they read public.team_members without triggering that table's own RLS
-- policies -- avoids the infinite-recursion trap of a policy on
-- team_members querying team_members through a normal (RLS-checked) query.

create or replace function public.is_team_coach(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and user_id = auth.uid()
      and role = 'coach'
  );
$$;

grant execute on function public.is_team_coach(uuid) to authenticated;

create or replace function public.is_caller_coach_of(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.team_members coach_tm
    join public.team_members athlete_tm on athlete_tm.team_id = coach_tm.team_id
    where coach_tm.user_id = auth.uid()
      and coach_tm.role = 'coach'
      and athlete_tm.user_id = p_user_id
      and athlete_tm.role = 'athlete'
  );
$$;

grant execute on function public.is_caller_coach_of(uuid) to authenticated;

-- teams: visible to any member (coach or athlete) of that team. No direct
-- insert/update policy -- team creation goes through create_team() below,
-- since generating a unique invite code and creating the coach's own
-- membership row need to happen atomically.
drop policy if exists "members can view their team" on public.teams;
create policy "members can view their team" on public.teams
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
        and team_members.user_id = auth.uid()
    )
  );

-- team_members: see your own row, or (if you're a coach) every row on your
-- roster. No direct insert policy -- joining goes through join_team() below,
-- since "does this invite code exist" can't be answered by a client-side
-- select without also exposing every other team's invite code to browsing.
drop policy if exists "own membership" on public.team_members;
create policy "own membership" on public.team_members
  for select using (auth.uid() = user_id);

drop policy if exists "coach can view roster" on public.team_members;
create policy "coach can view roster" on public.team_members
  for select using (public.is_team_coach(team_id));

-- Coaches can remove an athlete from their own roster directly (this is a
-- plain RLS-gated delete, consistent with how the rest of the app talks to
-- Supabase -- no RPC needed since there's no secret/atomicity concern here).
drop policy if exists "coach can remove athlete" on public.team_members;
create policy "coach can remove athlete" on public.team_members
  for delete using (
    role = 'athlete' and public.is_team_coach(team_id)
  );

create or replace function public.create_team(p_name text)
returns table (id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_code text;
  v_attempts int := 0;
begin
  if exists (select 1 from public.team_members where user_id = auth.uid()) then
    raise exception 'You are already on a team.';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Team name is required.';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.teams t where t.invite_code = v_code);
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not generate a unique invite code. Try again.';
    end if;
  end loop;

  insert into public.teams (coach_id, name, invite_code)
  values (auth.uid(), trim(p_name), v_code)
  returning teams.id into v_team_id;

  insert into public.team_members (team_id, user_id, role, display_name)
  values (v_team_id, auth.uid(), 'coach', auth.email());

  return query select v_team_id, trim(p_name), v_code;
end;
$$;

grant execute on function public.create_team(text) to authenticated;

create or replace function public.join_team(p_invite_code text)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_team_name text;
begin
  if exists (select 1 from public.team_members where user_id = auth.uid()) then
    raise exception 'You are already on a team.';
  end if;

  select teams.id, teams.name into v_team_id, v_team_name
  from public.teams
  where teams.invite_code = upper(trim(p_invite_code));

  if v_team_id is null then
    raise exception 'Invalid invite code.';
  end if;

  insert into public.team_members (team_id, user_id, role, display_name)
  values (v_team_id, auth.uid(), 'athlete', auth.email());

  return query select v_team_id, v_team_name;
end;
$$;

grant execute on function public.join_team(text) to authenticated;

-- Read-only roster access: a coach can SELECT (never edit/delete) their
-- roster's rows across the athlete-owned tables below. Each table keeps its
-- existing "own rows" FOR ALL policy from schema.sql / schema_v18_5.sql
-- untouched -- these are additional, permissive, SELECT-only policies that
-- Postgres OR's together with the existing ones, so athlete read/write
-- access to their own data is unaffected.

drop policy if exists "coach can view roster latest_stats" on public.latest_stats;
create policy "coach can view roster latest_stats" on public.latest_stats
  for select using (public.is_caller_coach_of(user_id));

drop policy if exists "coach can view roster stats_history" on public.stats_history;
create policy "coach can view roster stats_history" on public.stats_history
  for select using (public.is_caller_coach_of(user_id));

drop policy if exists "coach can view roster workout_logs" on public.workout_logs;
create policy "coach can view roster workout_logs" on public.workout_logs
  for select using (public.is_caller_coach_of(user_id));

drop policy if exists "coach can view roster exercise_checks" on public.exercise_checks;
create policy "coach can view roster exercise_checks" on public.exercise_checks
  for select using (public.is_caller_coach_of(user_id));

drop policy if exists "coach can view roster calendar_events" on public.calendar_events;
create policy "coach can view roster calendar_events" on public.calendar_events
  for select using (public.is_caller_coach_of(user_id));

drop policy if exists "coach can view roster prs" on public.prs;
create policy "coach can view roster prs" on public.prs
  for select using (public.is_caller_coach_of(user_id));

drop policy if exists "coach can view roster workout_sessions" on public.workout_sessions;
create policy "coach can view roster workout_sessions" on public.workout_sessions
  for select using (public.is_caller_coach_of(user_id));
