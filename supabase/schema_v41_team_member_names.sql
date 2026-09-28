-- Volleyball Tracker V41 schema (real names on the roster)
-- Run this once in the Supabase SQL Editor, after schema_v40_pilot_applications.sql.
-- Safe to re-run.
--
-- 1. Stop storing emails as team names: create_team / join_team insert
--    auth.email() as display_name. A trigger swaps it for the name the user
--    gave at signup (profiles.display_name), or the part before the @.
-- 2. Backfill existing rows the same way.
-- 3. Coaches can rename athletes (set_team_member_name RPC).
-- 4. Athletes can see their teammates' names (new SELECT policy).
--
-- Order matters: the backfill runs before the teammate policy, so no
-- emails are ever visible to other athletes.

-- 1. Name on insert -----------------------------------------------------

create or replace function public.team_member_default_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_name text;
begin
  if new.display_name is null or new.display_name like '%@%' then
    select nullif(trim(profiles.display_name), '') into v_profile_name
    from public.profiles
    where profiles.user_id = new.user_id;

    new.display_name := coalesce(v_profile_name, nullif(split_part(new.display_name, '@', 1), ''));
  end if;
  return new;
end;
$$;

drop trigger if exists team_member_default_name on public.team_members;
create trigger team_member_default_name
  before insert on public.team_members
  for each row execute function public.team_member_default_name();

-- 2. Backfill ------------------------------------------------------------

update public.team_members tm
set display_name = coalesce(
  (select nullif(trim(p.display_name), '') from public.profiles p where p.user_id = tm.user_id),
  nullif(split_part(tm.display_name, '@', 1), '')
)
where tm.display_name like '%@%';

-- 3. Coach renames an athlete -------------------------------------------
-- An RPC rather than an UPDATE policy, so a coach can change only the
-- name (never role, team or user) and only for athletes on their team.

create or replace function public.set_team_member_name(p_team_id uuid, p_user_id uuid, p_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if not public.is_team_coach(p_team_id) then
    raise exception 'Only the team''s coach can rename athletes.';
  end if;

  if char_length(v_name) < 1 or char_length(v_name) > 60 then
    raise exception 'Name must be 1 to 60 characters.';
  end if;

  update public.team_members
  set display_name = v_name
  where team_id = p_team_id
    and user_id = p_user_id
    and role = 'athlete';

  if not found then
    raise exception 'That athlete is not on this team.';
  end if;

  return v_name;
end;
$$;

grant execute on function public.set_team_member_name(uuid, uuid, text) to authenticated;

-- 4. Athletes see teammates ---------------------------------------------
-- SECURITY DEFINER helper, same reason as is_team_coach() in
-- schema_v20_teams.sql: a policy on team_members can't query team_members
-- through RLS without infinite recursion.

create or replace function public.is_team_member(p_team_id uuid)
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
  );
$$;

grant execute on function public.is_team_member(uuid) to authenticated;

drop policy if exists "team members can view teammates" on public.team_members;
create policy "team members can view teammates" on public.team_members
  for select using (public.is_team_member(team_id));
