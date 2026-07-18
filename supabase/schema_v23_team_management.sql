-- Volleyball Tracker V23 schema (team management: invite regen, leave, disband)
-- Run this once in the Supabase SQL Editor, after schema_v20_teams.sql.
-- Safe to re-run.

-- Athletes can remove their own membership row (self-service "leave team"),
-- mirroring the existing "coach can remove athlete" policy in schema_v20.
drop policy if exists "athlete can leave team" on public.team_members;
create policy "athlete can leave team" on public.team_members
  for delete using (
    role = 'athlete' and user_id = auth.uid()
  );

create or replace function public.regenerate_invite_code()
returns table (invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_code text;
  v_attempts int := 0;
begin
  select team_members.team_id into v_team_id
  from public.team_members
  where team_members.user_id = auth.uid()
    and team_members.role = 'coach';

  if v_team_id is null then
    raise exception 'You are not a coach of any team.';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.teams t where t.invite_code = v_code);
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not generate a unique invite code. Try again.';
    end if;
  end loop;

  update public.teams set invite_code = v_code where id = v_team_id;

  return query select v_code;
end;
$$;

grant execute on function public.regenerate_invite_code() to authenticated;

create or replace function public.delete_team()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  select team_members.team_id into v_team_id
  from public.team_members
  where team_members.user_id = auth.uid()
    and team_members.role = 'coach';

  if v_team_id is null then
    raise exception 'You are not a coach of any team.';
  end if;

  -- team_members.team_id references public.teams(id) on delete cascade,
  -- so deleting the team row cleans up every member row (coach + athletes)
  -- in one statement.
  delete from public.teams where id = v_team_id;
end;
$$;

grant execute on function public.delete_team() to authenticated;
