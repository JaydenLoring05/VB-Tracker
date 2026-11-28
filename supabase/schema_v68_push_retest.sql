-- NextRep V68 schema (P-08): retest-day push reminders
-- Run once in the Supabase SQL Editor, after schema_v67_viewer_links.sql.
-- Safe to re-run. The app works before and after this runs (until it runs,
-- the hourly job just doesn't send the retest message).
--
-- push_reminder_recipients() gains needs_retest: the player has tested a
-- vertical or approach touch before, and their latest test was 28 to 30 days
-- ago (the same 28 days as RETEST_DAYS in src/lib/resultsCard.ts). The 3-day
-- window means at most 3 reminders, never a daily nag. A player who never
-- tested gets nothing. A retest still counts as something to do, so it is
-- sent even when they already checked in and trained. Still at most one push
-- per player per local day (private.push_reminder_log).

drop function if exists public.push_reminder_recipients(text, timestamptz);

create or replace function public.push_reminder_recipients(p_secret text, p_now timestamptz default now())
returns table (
  user_id uuid,
  endpoint text,
  p256dh text,
  auth text,
  display_name text,
  needs_check_in boolean,
  needs_workout boolean,
  needs_retest boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  select secret_hash into v_hash from private.cron_secrets where name = 'daily_summary';
  if v_hash is null or p_secret is null
     or encode(extensions.digest(p_secret, 'sha256'), 'hex') <> v_hash then
    raise exception 'not authorized';
  end if;

  return query
  with due as (
    select
      p.user_id,
      p.display_name,
      p.push_reminder_time_zone as tz,
      (p_now at time zone p.push_reminder_time_zone)::date as local_date,
      trim(to_char(p_now at time zone p.push_reminder_time_zone, 'FMDay')) = any (p.push_training_days) as training_day
    from public.profiles p
    where p.push_reminder_hour is not null
      and extract(hour from (p_now at time zone p.push_reminder_time_zone))
          between p.push_reminder_hour and least(p.push_reminder_hour + 3, 23)
      and exists (select 1 from public.push_subscriptions s where s.user_id = p.user_id)
  ),
  tested as (
    -- The latest day a vertical or approach was logged, from either source.
    select d.user_id, max(t.day) as last_test
    from due d
    join lateral (
      select jt.tested_on as day
      from public.jump_tests jt
      where jt.user_id = d.user_id
      union all
      select (sh.created_at at time zone d.tz)::date
      from public.stats_history sh
      where sh.user_id = d.user_id
        and (coalesce(sh.vertical, 0) > 0 or coalesce(sh.approach, 0) > 0)
    ) t on true
    group by d.user_id
  ),
  todo as (
    select
      d.*,
      not exists (
        select 1 from public.stats_history sh
        where sh.user_id = d.user_id
          and (sh.created_at at time zone d.tz)::date = d.local_date
      ) as needs_check_in,
      d.training_day and not exists (
        select 1 from public.workout_sessions ws
        where ws.user_id = d.user_id
          and (ws.started_at at time zone d.tz)::date = d.local_date
      ) as needs_workout,
      coalesce(
        (d.local_date - te.last_test) >= 28 and (d.local_date - te.last_test) <= 30,
        false
      ) as needs_retest
    from due d
    left join tested te on te.user_id = d.user_id
  ),
  pending as (
    select t.* from todo t where t.needs_check_in or t.needs_workout or t.needs_retest
  ),
  claimed as (
    insert into private.push_reminder_log (user_id, local_date)
    select p.user_id, p.local_date from pending p
    on conflict do nothing
    returning private.push_reminder_log.user_id
  )
  select p.user_id, s.endpoint, s.p256dh, s.auth, p.display_name, p.needs_check_in, p.needs_workout, p.needs_retest
  from pending p
  join claimed c on c.user_id = p.user_id
  join public.push_subscriptions s on s.user_id = p.user_id;
end;
$$;

revoke all on function public.push_reminder_recipients(text, timestamptz) from public;
grant execute on function public.push_reminder_recipients(text, timestamptz) to anon, authenticated;

-- Check (should return true):
-- select exists (select 1 from pg_proc where proname = 'push_reminder_recipients' and pronargs = 2);
