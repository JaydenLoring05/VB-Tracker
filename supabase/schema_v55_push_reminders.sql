-- Volleyball Tracker V55 schema (phone push reminders for players)
-- Run this once in the Supabase SQL Editor, after schema_v54_daily_summary_date_fix.sql.
-- Needs schema_v47_daily_coach_summary.sql (it reuses private.cron_secrets and
-- the same CRON_SECRET). Safe to re-run.
--
-- A daily lock-screen reminder a player turns on for themselves, with or
-- without a team or coach.
--  * Settings → Phone reminders: the player allows notifications, which saves
--    this browser's push subscription (public.push_subscriptions; one row per
--    phone or browser), and picks an hour. Their time zone comes from the
--    device (profiles.push_reminder_hour / push_reminder_time_zone; a null
--    hour means off).
--  * The app keeps profiles.push_training_days up to date with the weekdays
--    the player's current plan trains, so rest days only get a check-in
--    reminder, never "time to train".
--  * The hourly job calls push_reminder_recipients() with the cron secret.
--    It returns players who are due now and still have something to do today
--    (no check-in, or a training day with no workout started), and logs them
--    so nobody gets two in a day. Subscriptions the push service says are gone
--    are removed with remove_push_subscription().

-- Saved push subscriptions. Each player sees and manages only their own.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

-- The player's own reminder settings.
alter table public.profiles
  add column if not exists push_reminder_hour smallint,
  add column if not exists push_reminder_time_zone text not null default 'America/Los_Angeles',
  add column if not exists push_training_days text[] not null default '{}';

alter table public.profiles drop constraint if exists profiles_push_reminder_hour_check;
alter table public.profiles add constraint profiles_push_reminder_hour_check
  check (push_reminder_hour is null or push_reminder_hour between 0 and 23);

-- Who was sent a push on which local day. Private: only the functions below use it.
create schema if not exists private;
create table if not exists private.push_reminder_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, local_date)
);
alter table private.push_reminder_log enable row level security;
revoke all on private.push_reminder_log from public;
revoke all on private.push_reminder_log from anon, authenticated;

-- The signed-in player turns reminders on (an hour and a time zone) or off (a null hour).
create or replace function public.set_push_reminder(p_hour smallint, p_time_zone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  if p_hour is not null and (p_hour < 0 or p_hour > 23) then
    raise exception 'Pick an hour between 0 and 23.';
  end if;
  if not exists (select 1 from pg_timezone_names where name = p_time_zone) then
    raise exception 'Unknown time zone.';
  end if;

  update public.profiles
  set push_reminder_hour = p_hour,
      push_reminder_time_zone = p_time_zone
  where user_id = auth.uid();
end;
$$;

revoke all on function public.set_push_reminder(smallint, text) from public;
grant execute on function public.set_push_reminder(smallint, text) to authenticated;

-- The signed-in player's training weekdays, as the app works them out.
create or replace function public.set_push_training_days(p_days text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_days, '{}')) d
    where d not in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
  ) then
    raise exception 'Unknown weekday.';
  end if;

  update public.profiles
  set push_training_days = coalesce(p_days, '{}')
  where user_id = auth.uid();
end;
$$;

revoke all on function public.set_push_training_days(text[]) from public;
grant execute on function public.set_push_training_days(text[]) to authenticated;

-- The hourly job. Returns (and logs) one row per subscription of each player
-- to remind right now: reminders on, at or up to 3 hours after their hour (so
-- a late or skipped run still sends), and still something to do today in
-- their time zone: no check-in yet, or a training day with no workout started.
-- needs_check_in and needs_workout say which, so the message can match.
create or replace function public.push_reminder_recipients(p_secret text, p_now timestamptz default now())
returns table (
  user_id uuid,
  endpoint text,
  p256dh text,
  auth text,
  display_name text,
  needs_check_in boolean,
  needs_workout boolean
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
  todo as (
    select
      d.*,
      -- Checked in today = a stats_history entry created today in their time
      -- zone (the same rule as the check-in reminder email, schema_v50).
      not exists (
        select 1 from public.stats_history sh
        where sh.user_id = d.user_id
          and (sh.created_at at time zone d.tz)::date = d.local_date
      ) as needs_check_in,
      d.training_day and not exists (
        select 1 from public.workout_sessions ws
        where ws.user_id = d.user_id
          and (ws.started_at at time zone d.tz)::date = d.local_date
      ) as needs_workout
    from due d
  ),
  pending as (
    select t.* from todo t where t.needs_check_in or t.needs_workout
  ),
  claimed as (
    insert into private.push_reminder_log (user_id, local_date)
    select p.user_id, p.local_date from pending p
    on conflict do nothing
    returning private.push_reminder_log.user_id
  )
  select p.user_id, s.endpoint, s.p256dh, s.auth, p.display_name, p.needs_check_in, p.needs_workout
  from pending p
  join claimed c on c.user_id = p.user_id
  join public.push_subscriptions s on s.user_id = p.user_id;
end;
$$;

revoke all on function public.push_reminder_recipients(text, timestamptz) from public;
grant execute on function public.push_reminder_recipients(text, timestamptz) to anon, authenticated;

-- The hourly job removes a subscription the push service reports as gone
-- (the player uninstalled the app or turned notifications off).
create or replace function public.remove_push_subscription(p_secret text, p_endpoint text)
returns void
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

  delete from public.push_subscriptions where endpoint = p_endpoint;
end;
$$;

revoke all on function public.remove_push_subscription(text, text) from public;
grant execute on function public.remove_push_subscription(text, text) to anon, authenticated;
