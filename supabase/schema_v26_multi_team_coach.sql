-- Volleyball Tracker V26 schema (multi-team-per-coach support)
-- Run this once in the Supabase SQL Editor, after schema_v25_removal_notices.sql.
-- Safe to re-run.

alter table public.team_members drop constraint if exists team_members_user_id_key;

create unique index if not exists team_members_one_team_per_athlete
  on public.team_members (user_id)
  where role = 'athlete';

alter table public.team_members drop constraint if exists team_members_team_id_user_id_key;
alter table public.team_members
  add constraint team_members_team_id_user_id_key unique (team_id, user_id);

-- regenerate_invite_code and delete_team used to look up "the" team via
-- `where user_id = auth.uid() and role = 'coach'` with no limit, assuming a
-- single match. Now that a coach can have multiple rows, both take an
-- explicit p_team_id and check ownership of that specific team.

drop function if exists public.regenerate_invite_code();
create or replace function public.regenerate_invite_code(p_team_id uuid)
returns table (invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_attempts int := 0;
begin
  if not public.is_team_coach(p_team_id) then
    raise exception 'You are not a coach of this team.';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.teams t where t.invite_code = v_code);
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not generate a unique invite code. Try again.';
    end if;
  end loop;

  update public.teams set invite_code = v_code where id = p_team_id;

  return query select v_code;
end;
$$;

grant execute on function public.regenerate_invite_code(uuid) to authenticated;

drop function if exists public.delete_team();
create or replace function public.delete_team(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_team_coach(p_team_id) then
    raise exception 'You are not a coach of this team.';
  end if;

  delete from public.teams where id = p_team_id;
end;
$$;

grant execute on function public.delete_team(uuid) to authenticated;

-- create_team currently blocks creation if the caller has ANY existing
-- team_members row, coach or athlete -- that's what made a second team
-- impossible before this migration. Athletes must still stay single-team,
-- but a coach creating a second team is exactly this feature's point.
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
  if exists (select 1 from public.team_members where user_id = auth.uid() and role = 'athlete') then
    raise exception 'You are already on a team as an athlete.';
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
