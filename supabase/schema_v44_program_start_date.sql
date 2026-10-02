-- Volleyball Tracker V44 schema (per-athlete program start date)
-- Run this once in the Supabase SQL Editor, after schema_v43_team_programs.sql.
-- Safe to re-run.
--
-- The Monday of the athlete's program week 1. With it, the app knows which
-- program week and day any date falls on, so the coach's Attention Center can
-- flag missed *assigned* days instead of "fewer than 2 sessions in 7 days".
--
-- No new policies: profiles already has "own profile" read/insert/update for
-- the athlete (schema_v22) and "coach can view roster profiles" for their
-- coach, which cover this column.

alter table public.profiles
  add column if not exists program_start_date date;
