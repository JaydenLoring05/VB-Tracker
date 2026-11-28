-- NextRep V66 schema (G-07): weekly challenge weeks in the athlete's own time zone
--
-- Before: a challenge week was Monday 00:00 to Sunday 24:00 UTC for everyone,
-- so a Sunday-evening workout in California counted toward the next week.
-- After: each athlete's week runs in their own zone, saved on their profile by
-- the app (profiles.time_zone, an IANA name such as America/Los_Angeles). An
-- athlete with no zone saved, or an unknown name, still counts in UTC.
-- Safe to run more than once. The app works before and after this runs.

alter table public.profiles add column if not exists time_zone text
  check (time_zone is null or char_length(time_zone) <= 64);

-- The athlete's zone if it is a real one, else UTC.
create or replace function public.athlete_time_zone(p_user_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select z.name
       from public.profiles p
       join pg_timezone_names z on z.name = p.time_zone
      where p.user_id = p_user_id
      limit 1),
    'UTC'
  );
$$;

revoke all on function public.athlete_time_zone(uuid) from public, anon, authenticated;

-- Same signature as v63; only the week boundaries change.
create or replace function public.challenge_total(p_user_id uuid, p_week_start date, p_metric text)
returns int
language sql
security definer
stable
set search_path = public
as $$
  with z as (select public.athlete_time_zone(p_user_id) as tz)
  select case p_metric
    when 'jumps' then (
      select coalesce(sum(ws.reps), 0)::int
      from public.workout_sets ws, z
      where ws.user_id = p_user_id
        and ws.created_at >= (p_week_start::timestamp at time zone z.tz)
        and ws.created_at < ((p_week_start + 7)::timestamp at time zone z.tz)
        and ws.exercise ~* '(\mjumps?\M|\mhops?\M|\mbounds?\M|pogo|depth drops?|snap downs?|plyo|step-offs?|drop squat)'
    )
    when 'workouts' then (
      select count(*)::int
      from public.workout_sessions s, z
      where s.user_id = p_user_id
        and s.ended_at >= (p_week_start::timestamp at time zone z.tz)
        and s.ended_at < ((p_week_start + 7)::timestamp at time zone z.tz)
    )
    else 0
  end;
$$;

revoke all on function public.challenge_total(uuid, date, text) from public;
revoke all on function public.challenge_total(uuid, date, text) from anon, authenticated;

-- Check: select public.athlete_time_zone(auth.uid()); -- returns your zone or UTC
