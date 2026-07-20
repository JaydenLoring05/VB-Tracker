-- Volleyball Tracker V30 schema (accurate active-time workout timer)
-- Run this once in the Supabase SQL Editor, after schema_v29_team_day_overrides.sql.
-- Safe to re-run.

-- workout_sessions previously only tracked started_at/ended_at, so
-- duration_seconds was computed as raw wall-clock time at finish -- if an
-- athlete started a workout, closed the tab for hours, and came back to
-- finish it, the recorded duration included all of that away time.
--
-- active_seconds accumulates only the time the workout screen was actually
-- open. resumed_at marks the start of the current open "active window";
-- it's null while the screen isn't open (paused). See
-- src/hooks/useActiveWorkoutSession.ts for how these are maintained.

alter table public.workout_sessions
  add column if not exists active_seconds int not null default 0,
  add column if not exists resumed_at timestamptz default now();
