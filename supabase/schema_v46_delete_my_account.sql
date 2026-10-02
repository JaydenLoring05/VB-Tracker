-- Volleyball Tracker V46 schema (self-serve account deletion)
-- Run this once in the Supabase SQL Editor, after schema_v45_starting_program.sql.
-- Safe to re-run.
--
-- delete_my_account() lets a signed-in user delete their own account from the
-- Settings page. It can only ever delete auth.uid(): the caller's own account.
-- No service-role key is involved; the browser calls this RPC with the
-- user's own session.
--
-- Every app table references auth.users with "on delete cascade" (or "set
-- null" for film_tags.athlete_id), so deleting the auth user removes all of
-- their rows. A coach's teams are tied to them by teams.coach_id, so deleting
-- a coach would also delete their teams (rosters, programs, calendar, film).
-- The function refuses to do that unless the caller passes
-- p_delete_owned_teams => true, which the app only sends after showing the
-- coach which teams will go.

create or replace function public.delete_my_account(p_delete_owned_teams boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;

  if not p_delete_owned_teams and exists (select 1 from public.teams where coach_id = v_uid) then
    raise exception 'owns_teams'
      using hint = 'This account coaches one or more teams. Call again with p_delete_owned_teams => true to delete them too.';
  end if;

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account(boolean) from public;
revoke all on function public.delete_my_account(boolean) from anon;
grant execute on function public.delete_my_account(boolean) to authenticated;
