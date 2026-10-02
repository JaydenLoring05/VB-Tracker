-- Volleyball Tracker V45 schema (position-based starting program)
-- Run this once in the Supabase SQL Editor, after schema_v44_program_start_date.sql.
-- Safe to re-run.
--
-- The starting program an athlete picked (set from their position at
-- onboarding; changeable on the Workouts page). Null means the recommended
-- 20-week plan. The templates themselves live in src/data/positionPrograms.ts.
-- A coach-assigned program or coach edits to the plan always take precedence.
--
-- No new policies: profiles already has "own profile" read/insert/update for
-- the athlete (schema_v22) and "coach can view roster profiles".

alter table public.profiles
  add column if not exists starting_program text;

alter table public.profiles drop constraint if exists profiles_starting_program_check;
alter table public.profiles add constraint profiles_starting_program_check
  check (starting_program is null or starting_program in ('outside_opposite', 'middle', 'setter', 'libero'));
