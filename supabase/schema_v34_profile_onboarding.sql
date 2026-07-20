-- Volleyball Tracker V34 schema (name + onboarding answers on profiles)
-- Run this once in the Supabase SQL Editor, after schema_v33_team_calendar.sql.
-- Safe to re-run.

-- Extends the existing profiles table (schema_v22) rather than adding a
-- new one. Coach-only and athlete-only fields both stay nullable -- each
-- role only ever fills in its own half.

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists competitive_level text,
  add column if not exists position text,
  add column if not exists season_start date,
  add column if not exists season_end date,
  add column if not exists training_days_per_week int,
  add column if not exists athletes_expected int,
  add column if not exists training_goals text[];
