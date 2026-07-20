-- Volleyball Tracker V27 schema (team plan tier)
-- Run this once in the Supabase SQL Editor, after schema_v26_multi_team_coach.sql.
-- Safe to re-run.

alter table public.teams
  add column if not exists plan_tier text not null default 'pilot';

alter table public.teams
  drop constraint if exists teams_plan_tier_check;
alter table public.teams
  add constraint teams_plan_tier_check check (plan_tier in ('pilot', 'paid'));

-- No billing integration yet. To manually mark a team as paid (e.g. once a
-- coach converts during the pilot), run:
--   update public.teams set plan_tier = 'paid' where id = '<team-uuid>';
-- Find the team's id via: select id, name from public.teams where name = '<team name>';
