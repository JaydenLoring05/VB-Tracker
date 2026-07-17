-- Volleyball Tracker V19 schema
-- Run this once in the Supabase SQL Editor, after schema.sql and schema_v18_5.sql.
-- Safe to re-run.

-- Prevents duplicate default calendar events from being seeded twice
-- (e.g. React StrictMode double-invoke, or two tabs loading concurrently).
create unique index if not exists calendar_events_user_date_type_title_key
  on public.calendar_events (user_id, date, type, title);
