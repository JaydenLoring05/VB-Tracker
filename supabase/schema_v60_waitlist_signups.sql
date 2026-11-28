-- Volleyball Tracker V60 schema (athlete waitlist sign-ups, F-41)
-- Run this once in the Supabase SQL Editor. Safe to re-run.
-- (v60, not v59: open PR #101 already uses schema_v59_team_exercises.sql.)
--
-- Stores sign-ups from the public /join page. The public site can only INSERT
-- a row. Nobody can read, update, or delete rows through the API (there are
-- deliberately no select/update/delete policies); the owner reads sign-ups in
-- the Supabase dashboard (Table Editor), which bypasses RLS.

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (
    char_length(email) <= 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
  ),
  position text check (
    position is null
    or position in ('outside', 'opposite', 'middle', 'setter', 'libero', 'not_sure', 'other_sport')
  ),
  age_group text check (age_group is null or age_group in ('under14', '14to17', '18plus')),
  source text not null default 'join' check (source in ('join'))
);

-- One sign-up per email (case-insensitive). The app treats a duplicate as
-- already received, so this doubles as duplicate protection.
create unique index if not exists waitlist_signups_email_key
  on public.waitlist_signups (lower(email));

create index if not exists waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at desc);

alter table public.waitlist_signups enable row level security;

-- Insert only, and only the visitor-supplied columns. id, created_at and
-- source always take their defaults.
revoke all on public.waitlist_signups from anon, authenticated;
grant insert (name, email, position, age_group)
  on public.waitlist_signups to anon, authenticated;

drop policy if exists "anyone can join the waitlist" on public.waitlist_signups;
create policy "anyone can join the waitlist" on public.waitlist_signups
  for insert to anon, authenticated
  with check (source = 'join');

-- Global flood guard: more than 120 sign-ups in 10 minutes refuses further
-- inserts until it cools down. Runs as the function owner so it can count
-- rows the caller is not allowed to read.
create or replace function public.waitlist_signups_flood_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.waitlist_signups
    where created_at > now() - interval '10 minutes'
  ) >= 120 then
    raise exception 'waitlist_signups_rate_limited';
  end if;
  return new;
end;
$$;

drop trigger if exists waitlist_signups_flood_guard on public.waitlist_signups;
create trigger waitlist_signups_flood_guard
  before insert on public.waitlist_signups
  for each row execute function public.waitlist_signups_flood_guard();
