-- Volleyball Tracker V58 schema (the athlete's regular week, F-38)
-- Run this once in the Supabase SQL Editor, after schema_v57_athlete_billing.sql.
-- Safe to re-run.
--
-- profiles.weekly_schedule: what the athlete already does outside NextRep on
-- each weekday, e.g. {"Monday": "practice", "Tuesday": "liftClass"}. The plan
-- takes the jumping out on practice days and keeps lift-elsewhere days to
-- rehab, core and mobility (src/lib/trainingProfile.ts).
--
-- No new policies: profiles already has "own profile" read/insert/update for
-- the athlete (schema_v22) and "coach can view roster profiles".

alter table public.profiles
  add column if not exists weekly_schedule jsonb not null default '{}'::jsonb;

alter table public.profiles drop constraint if exists profiles_weekly_schedule_check;
alter table public.profiles add constraint profiles_weekly_schedule_check
  check (jsonb_typeof(weekly_schedule) = 'object');
