-- V48: self-rated skills for the Stats page radar chart.
-- (Merged in #40 as schema_v44_skill_ratings.sql; renumbered because v44 is
-- schema_v44_program_start_date.sql. Same statement, safe to re-run.)
-- Adds one jsonb column to performance_profiles holding six ratings, each a
-- whole number from 1 to 5 or null (not rated yet):
--   { "power": 4, "jumping": 5, "stamina": 3, "gameSense": 4, "technique": 3, "speed": 4 }
-- No new policies needed: the existing performance_profiles policies cover the
-- column (athletes read/write their own row, coaches read their roster's).
-- Run once in the Supabase SQL Editor, after schema_v47_daily_coach_summary.sql
-- (it only needs schema_v24_performance_profiles.sql).
-- Safe to re-run.

alter table public.performance_profiles
  add column if not exists skill_ratings jsonb not null default '{}'::jsonb;
