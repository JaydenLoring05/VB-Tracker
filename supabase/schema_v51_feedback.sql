-- Volleyball Tracker V51 schema (in-app feedback)
-- Run this once in the Supabase SQL Editor, after schema_v50_checkin_reminders.sql.
-- Safe to re-run.
--
-- "Send feedback" (Settings and the More menu) saves here through the
-- signed-in user's own session. Each user can insert their own rows and read
-- only their own; nobody else's. Read everything yourself in the Supabase
-- Table Editor (it bypasses RLS).

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  page text check (page is null or char_length(page) <= 200),
  role text check (role is null or role in ('coach', 'athlete')),
  team_id uuid references public.teams (id) on delete set null,
  app_version text check (app_version is null or char_length(app_version) <= 64),
  device text check (device is null or char_length(device) <= 120),
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "insert own feedback" on public.feedback;
create policy "insert own feedback" on public.feedback
  for insert with check (auth.uid() = user_id);

drop policy if exists "read own feedback" on public.feedback;
create policy "read own feedback" on public.feedback
  for select using (auth.uid() = user_id);
