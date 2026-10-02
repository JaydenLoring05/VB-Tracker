-- V42: timed sets (planks, holds, stretches).
-- Adds a seconds column so a set can be logged as a duration instead of reps.
-- Run once in the Supabase SQL Editor. Safe to re-run.

alter table public.workout_sets
  add column if not exists seconds int check (seconds is null or seconds >= 0);
