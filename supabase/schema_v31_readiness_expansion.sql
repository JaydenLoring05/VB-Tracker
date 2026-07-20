-- Volleyball Tracker V31 schema (expanded readiness check-in fields)
-- Run this once in the Supabase SQL Editor, after schema_v30_workout_active_time.sql.
-- Safe to re-run.

-- Adds stress, lower-back pain, ankle pain, and motivation to the existing
-- 0-10 scale check-in fields (matches sleep/kneePain/shoulderPain/soreness/
-- energy's existing shape -- no new UI pattern, StatsForm's field list just
-- grows). stress and the pain fields are "higher = worse"; motivation is
-- "higher = better", matching how "energy" already works.

alter table public.latest_stats
  add column if not exists stress numeric,
  add column if not exists lower_back_pain numeric,
  add column if not exists ankle_pain numeric,
  add column if not exists motivation numeric;

alter table public.stats_history
  add column if not exists stress numeric,
  add column if not exists lower_back_pain numeric,
  add column if not exists ankle_pain numeric,
  add column if not exists motivation numeric;
