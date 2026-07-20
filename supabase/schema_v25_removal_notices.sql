-- Volleyball Tracker V25 schema (athlete removal notices)
-- Run this once in the Supabase SQL Editor, after schema_v24_performance_profiles.sql.
-- Safe to re-run.

create table if not exists public.removal_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  team_name text not null,
  removed_at timestamptz not null default now()
);

alter table public.removal_notices enable row level security;

drop policy if exists "own removal notices select" on public.removal_notices;
create policy "own removal notices select" on public.removal_notices
  for select using (auth.uid() = user_id);

drop policy if exists "own removal notices delete" on public.removal_notices;
create policy "own removal notices delete" on public.removal_notices
  for delete using (auth.uid() = user_id);

-- No insert policy: rows are only ever created by the trigger below, which
-- runs as the migration-owning role and so bypasses RLS -- same pattern as
-- create_team()/join_team() in schema_v20 not needing an insert policy on
-- team_members.

create or replace function public.notify_athlete_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_name text;
begin
  -- Only notify when someone else removed the athlete -- a self-service
  -- "leave team" delete (auth.uid() = OLD.user_id) should stay silent.
  if OLD.role = 'athlete' and auth.uid() is distinct from OLD.user_id then
    select name into v_team_name from public.teams where id = OLD.team_id;

    insert into public.removal_notices (user_id, team_name)
    values (OLD.user_id, coalesce(v_team_name, 'your team'));
  end if;

  return OLD;
end;
$$;

drop trigger if exists trg_notify_athlete_removal on public.team_members;
create trigger trg_notify_athlete_removal
  after delete on public.team_members
  for each row execute function public.notify_athlete_removal();
