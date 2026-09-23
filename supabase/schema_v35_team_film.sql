-- Volleyball Tracker V35 schema (team film review)
-- Run this once in the Supabase SQL Editor, after schema_v34_profile_onboarding.sql.
-- Safe to re-run.

create table if not exists public.team_film (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  event_id uuid references public.team_calendar_events (id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  video_url text not null check (video_url ~* '^https?://'),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.film_tags (
  id uuid primary key default gen_random_uuid(),
  film_id uuid not null references public.team_film (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  seconds integer not null check (seconds >= 0),
  tag text not null check (tag in ('kill', 'error', 'block', 'dig', 'ace', 'serve_error', 'set', 'note')),
  note text check (char_length(note) <= 280),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.team_film enable row level security;
alter table public.film_tags enable row level security;

drop policy if exists "team members can view team film" on public.team_film;
create policy "team members can view team film" on public.team_film
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_film.team_id
        and team_members.user_id = auth.uid()
    )
  );

-- Reuses is_team_coach() from schema_v20_teams.sql, already parameterized
-- by team_id.
drop policy if exists "coach can manage team film" on public.team_film;
create policy "coach can manage team film" on public.team_film
  for all using (
    public.is_team_coach(team_film.team_id)
  ) with check (
    public.is_team_coach(team_film.team_id)
  );

drop policy if exists "team members can view film tags" on public.film_tags;
create policy "team members can view film tags" on public.film_tags
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = film_tags.team_id
        and team_members.user_id = auth.uid()
    )
  );

drop policy if exists "coach can manage film tags" on public.film_tags;
create policy "coach can manage film tags" on public.film_tags
  for all using (
    public.is_team_coach(film_tags.team_id)
  ) with check (
    public.is_team_coach(film_tags.team_id)
  );
