-- Volleyball Tracker V40 schema (pilot applications)
-- Run this once in the Supabase SQL Editor.
-- Safe to re-run.
--
-- Stores applications submitted from the public /pilot page. The public site
-- can only INSERT a row. Nobody can read, update, or delete rows through the
-- API (there are deliberately no select/update/delete policies); the owner
-- reads applications in the Supabase dashboard (Table Editor), which bypasses
-- RLS.

create table if not exists public.pilot_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  coach_name text not null check (char_length(coach_name) between 2 and 80),
  email text not null check (
    char_length(email) <= 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
  ),
  team_name text not null check (char_length(team_name) between 2 and 100),
  level text not null check (level in ('high_school', 'club', 'college', 'other')),
  roster_size integer not null check (roster_size between 1 and 200),
  tracking_method text not null check (
    tracking_method in ('spreadsheets', 'paper', 'other_app', 'nothing', 'other')
  ),
  notes text check (notes is null or char_length(notes) <= 1000),
  -- Owner-managed triage field. Anonymous inserts must start at 'new'.
  status text not null default 'new' check (status in ('new', 'contacted', 'accepted', 'declined'))
);

-- One application per email address (case-insensitive). The app treats a
-- duplicate as already received, so this doubles as duplicate protection.
create unique index if not exists pilot_applications_email_key
  on public.pilot_applications (lower(email));

create index if not exists pilot_applications_created_at_idx
  on public.pilot_applications (created_at desc);

alter table public.pilot_applications enable row level security;

-- Lock the table down at the privilege level too, then grant INSERT on the
-- applicant-supplied columns only. id, created_at, and status always take their
-- defaults, so a caller using the public anon key directly (bypassing the
-- website) cannot forge timestamps or set a triage status.
revoke all on public.pilot_applications from anon, authenticated;
grant insert (coach_name, email, team_name, level, roster_size, tracking_method, notes)
  on public.pilot_applications to anon, authenticated;

drop policy if exists "anyone can apply" on public.pilot_applications;
create policy "anyone can apply" on public.pilot_applications
  for insert to anon, authenticated
  with check (status = 'new');

-- Global flood guard: if more than 60 applications land in a 10 minute window,
-- refuse further inserts until it cools down. Runs as the function owner so it
-- can count rows the caller is not allowed to read.
create or replace function public.pilot_applications_flood_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.pilot_applications
    where created_at > now() - interval '10 minutes'
  ) >= 60 then
    raise exception 'pilot_applications_rate_limited';
  end if;
  return new;
end;
$$;

drop trigger if exists pilot_applications_flood_guard on public.pilot_applications;
create trigger pilot_applications_flood_guard
  before insert on public.pilot_applications
  for each row execute function public.pilot_applications_flood_guard();
