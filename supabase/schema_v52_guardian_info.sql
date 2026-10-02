-- Volleyball Tracker V52 schema (parent or guardian info for athletes under 18)
-- Run this once in the Supabase SQL Editor, after schema_v51_feedback.sql.
-- Safe to re-run.
--
-- Onboarding asks athletes "Are you 18 or older?". An athlete who answers no
-- must give a parent or guardian name and email and confirm that person knows
-- they use NextRep and that the coach can see their check-ins. No date of
-- birth is collected.
--   is_adult null  = hasn't answered yet (athletes who joined before this)
--   is_adult true  = 18 or older
--   is_adult false = under 18; guardian fields are required (check below)
-- No new policies: the athlete reads and writes their own profile (v22) and
-- their coach can read roster profiles, which is how the roster shows a
-- "guardian info missing" flag.

alter table public.profiles
  add column if not exists is_adult boolean,
  add column if not exists guardian_name text,
  add column if not exists guardian_email text,
  add column if not exists guardian_acknowledged_at timestamptz;

alter table public.profiles drop constraint if exists profiles_guardian_required_check;
alter table public.profiles add constraint profiles_guardian_required_check
  check (
    is_adult is distinct from false
    or (
      char_length(trim(coalesce(guardian_name, ''))) between 1 and 100
      and guardian_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
      and char_length(guardian_email) <= 254
      and guardian_acknowledged_at is not null
    )
  );
