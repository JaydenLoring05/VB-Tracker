-- Volleyball Tracker V32 schema (post-workout RPE rating)
-- Run this once in the Supabase SQL Editor, after schema_v31_readiness_expansion.sql.
-- Safe to re-run.

alter table public.workout_sessions
  add column if not exists rpe int;

alter table public.workout_sessions
  drop constraint if exists workout_sessions_rpe_check;
alter table public.workout_sessions
  add constraint workout_sessions_rpe_check check (rpe is null or (rpe between 1 and 10));
