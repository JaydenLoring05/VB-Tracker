-- Volleyball Tracker V49 schema (invite link preview)
-- Run this once in the Supabase SQL Editor, after schema_v48_skill_ratings.sql.
-- Safe to re-run.
--
-- /join/<code> shows "Join <team name>" before the athlete signs up, and a
-- clear message when the code is wrong or was regenerated. RLS only lets
-- members read teams, so this function answers one question for anyone:
-- which team, if any, does this invite code belong to? It returns the team
-- name and nothing else. The invite code is already the shared secret that
-- lets someone join, so revealing the name to whoever has the code adds no
-- new access.

create or replace function public.invite_preview(p_invite_code text)
returns table (team_name text)
language sql
security definer
set search_path = public
stable
as $$
  select t.name
  from public.teams t
  where t.invite_code = upper(trim(p_invite_code))
  limit 1;
$$;

revoke all on function public.invite_preview(text) from public;
grant execute on function public.invite_preview(text) to anon, authenticated;
