-- NextRep V61 schema (self-serve athlete sign-up and the under-13 parent step, N-03)
-- Run this once in the Supabase SQL Editor, after schema_v60_waitlist_signups.sql.
-- (v59 is reserved for F-22's team_exercises, still an open branch.)
-- Safe to re-run.
--
-- Jayden's rule (2026-11-03): athletes under 13 need a parent or guardian's
-- consent (their email and a checkbox) before the account is created.
-- 13 and up have no parent step. Schema v52 required a guardian name, email
-- and confirmation for everyone under 18; this file replaces that rule.
--   under_13 null  = hasn't told us their age (older accounts)
--   under_13 false = 13 or older
--   under_13 true  = under 13; guardian_email and guardian_acknowledged_at
--                    are required (check below). guardian_name is optional.
-- Guardian info already saved for 13 to 17 year olds under v52 is kept.
--
-- sport: what the athlete trains for, picked at sign-up.
--
-- No new policies: the athlete reads and writes their own profile (v22) and
-- their coach can read roster profiles.

alter table public.profiles
  add column if not exists sport text,
  add column if not exists under_13 boolean;

alter table public.profiles drop constraint if exists profiles_sport_check;
alter table public.profiles add constraint profiles_sport_check
  check (
    sport is null
    or sport in ('volleyball', 'basketball', 'soccer', 'football', 'track', 'baseballSoftball', 'tennis', 'other')
  );

-- Replace v52's under-18 rule with the under-13 rule.
alter table public.profiles drop constraint if exists profiles_guardian_required_check;
alter table public.profiles drop constraint if exists profiles_parent_consent_check;
alter table public.profiles add constraint profiles_parent_consent_check
  check (
    under_13 is distinct from true
    or (
      guardian_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
      and char_length(guardian_email) <= 254
      and guardian_acknowledged_at is not null
    )
  );

alter table public.profiles drop constraint if exists profiles_guardian_name_length_check;
alter table public.profiles add constraint profiles_guardian_name_length_check
  check (guardian_name is null or char_length(guardian_name) <= 100);

-- Check (should return 2):
-- select count(*) from information_schema.columns
-- where table_schema = 'public' and table_name = 'profiles' and column_name in ('sport', 'under_13');
