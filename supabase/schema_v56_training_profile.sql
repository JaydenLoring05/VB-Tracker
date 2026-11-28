-- Volleyball Tracker V56 schema (training profile on the account, F-34)
-- Run this once in the Supabase SQL Editor, after schema_v55_push_reminders.sql.
-- Safe to re-run.
--
-- The athlete's training profile: level, sore areas and age group. The plan
-- adapts to it (src/lib/trainingProfile.ts). Before this file it lived only
-- in the browser; keeping it on the account means it follows the athlete to
-- every device and the coach can see it.
--
-- No new policies: profiles already has "own profile" read/insert/update for
-- the athlete (schema_v22) and "coach can view roster profiles".

alter table public.profiles
  add column if not exists training_level text,
  add column if not exists sore_areas text[] not null default '{}',
  add column if not exists age_group text;

alter table public.profiles drop constraint if exists profiles_training_level_check;
alter table public.profiles add constraint profiles_training_level_check
  check (training_level is null or training_level in ('beginner', 'intermediate', 'advanced'));

alter table public.profiles drop constraint if exists profiles_sore_areas_check;
alter table public.profiles add constraint profiles_sore_areas_check
  check (sore_areas <@ array['knee', 'shoulder', 'lowerBack', 'ankle']::text[]);

alter table public.profiles drop constraint if exists profiles_age_group_check;
alter table public.profiles add constraint profiles_age_group_check
  check (age_group is null or age_group in ('under14', '14to17', '18plus'));
