-- Volleyball Tracker V66 schema (athlete onboarding quiz, P-03)
-- Run this once in the Supabase SQL Editor, after schema_v65_billing_plan.sql.
-- Safe to re-run.
--
-- Three answers from the athlete onboarding quiz (src/lib/onboardingQuiz.ts):
-- how long they've lifted, what equipment they have, and where they are in
-- their season. The other quiz answers reuse existing columns: goals in
-- training_goals and season dates in season_start / season_end (v34),
-- practice days in weekly_schedule (v58), level in training_level (v56).
--
-- Until this runs, onboarding still finishes: the app saves these three in a
-- separate write and only logs the error.
--
-- No new policies: profiles already has "own profile" read/insert/update for
-- the athlete (schema_v22) and "coach can view roster profiles".

alter table public.profiles
  add column if not exists years_lifting text,
  add column if not exists equipment text,
  add column if not exists season_phase text;

alter table public.profiles drop constraint if exists profiles_years_lifting_check;
alter table public.profiles add constraint profiles_years_lifting_check
  check (years_lifting is null or years_lifting in ('none', 'under1', '1to2', '3plus'));

alter table public.profiles drop constraint if exists profiles_equipment_check;
alter table public.profiles add constraint profiles_equipment_check
  check (equipment is null or equipment in ('fullGym', 'dumbbells', 'bodyweight'));

alter table public.profiles drop constraint if exists profiles_season_phase_check;
alter table public.profiles add constraint profiles_season_phase_check
  check (season_phase is null or season_phase in ('offSeason', 'preseason', 'inSeason'));
