-- NextRep V63 schema (weekly challenge and opt-in leaderboard, G-06)
-- Run this once in the Supabase SQL Editor, after schema_v62_jump_tests.sql
-- (it reads profiles.under_13 from schema_v61).
-- Safe to re-run.
--
-- One challenge a week for everyone (chosen in src/lib/challenge.ts): a jumps
-- goal (reps logged on jump exercises) or a workouts goal (finished
-- workouts). Weeks start on Monday and are counted in UTC.
--
-- Privacy:
-- - Joining is per week. The leaderboard is opt-in (on_leaderboard).
-- - The leaderboard shows only a first name and last initial ("Ava T.") and
--   a total. Nobody can read another athlete's rows: totals come from
--   security definer functions that return nothing else.
-- - Athletes under 13 can join the challenge but never appear on the
--   leaderboard (checked by the policy and by the function).

create table if not exists public.challenge_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  challenge_id text not null check (char_length(challenge_id) <= 40),
  on_leaderboard boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.challenge_entries enable row level security;

drop policy if exists "own rows" on public.challenge_entries;
create policy "own rows" on public.challenge_entries
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      not on_leaderboard
      or not coalesce((select p.under_13 from public.profiles p where p.user_id = auth.uid()), false)
    )
  );

-- One athlete's total for a week. Internal: not callable from the app.
create or replace function public.challenge_total(p_user_id uuid, p_week_start date, p_metric text)
returns int
language sql
security definer
stable
set search_path = public
as $$
  select case p_metric
    when 'jumps' then (
      select coalesce(sum(ws.reps), 0)::int
      from public.workout_sets ws
      where ws.user_id = p_user_id
        and ws.created_at >= p_week_start::timestamptz
        and ws.created_at < (p_week_start + 7)::timestamptz
        and ws.exercise ~* '(\mjumps?\M|\mhops?\M|\mbounds?\M|pogo|depth drops?|snap downs?|plyo|step-offs?|drop squat)'
    )
    when 'workouts' then (
      select count(*)::int
      from public.workout_sessions s
      where s.user_id = p_user_id
        and s.ended_at >= p_week_start::timestamptz
        and s.ended_at < (p_week_start + 7)::timestamptz
    )
    else 0
  end;
$$;

revoke all on function public.challenge_total(uuid, date, text) from public;
revoke all on function public.challenge_total(uuid, date, text) from anon, authenticated;

-- The caller's own total, whether or not they joined.
create or replace function public.weekly_challenge_my_total(p_week_start date, p_metric text)
returns int
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if p_metric not in ('jumps', 'workouts') then
    raise exception 'unknown challenge metric';
  end if;
  return public.challenge_total(auth.uid(), p_week_start, p_metric);
end;
$$;

-- Top 25 opted-in athletes for the week: "First L." and a total only.
create or replace function public.weekly_challenge_board(p_week_start date, p_metric text)
returns table (label text, total int, is_me boolean)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if p_metric not in ('jumps', 'workouts') then
    raise exception 'unknown challenge metric';
  end if;

  return query
  with entrants as (
    select e.user_id, regexp_split_to_array(trim(coalesce(p.display_name, '')), '\s+') as parts
    from public.challenge_entries e
    left join public.profiles p on p.user_id = e.user_id
    where e.week_start = p_week_start
      and e.on_leaderboard
      and not coalesce(p.under_13, false)
  )
  select
    case
      when parts = array[''] then 'Athlete'
      when array_length(parts, 1) = 1 then parts[1]
      else parts[1] || ' ' || upper(left(parts[array_length(parts, 1)], 1)) || '.'
    end as label,
    public.challenge_total(entrants.user_id, p_week_start, p_metric) as total,
    entrants.user_id = auth.uid() as is_me
  from entrants
  -- Positions, not names: "total" and "label" are also this function's
  -- output variables, and naming them here is ambiguous in PL/pgSQL.
  order by 2 desc, 1
  limit 25;
end;
$$;

revoke all on function public.weekly_challenge_my_total(date, text) from public, anon;
revoke all on function public.weekly_challenge_board(date, text) from public, anon;
grant execute on function public.weekly_challenge_my_total(date, text) to authenticated;
grant execute on function public.weekly_challenge_board(date, text) to authenticated;

-- Check (should return true, true):
-- select to_regclass('public.challenge_entries') is not null,
--        to_regprocedure('public.weekly_challenge_board(date,text)') is not null;
