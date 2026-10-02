-- Volleyball Tracker V50 schema (athlete check-in reminder emails)
-- Run this once in the Supabase SQL Editor, after schema_v49_invite_preview.sql.
-- Needs schema_v47_daily_coach_summary.sql (it reuses private.cron_secrets and
-- the same CRON_SECRET). Safe to re-run.
--
-- A daily email to athletes who haven't checked in yet that day.
--  * The coach picks the time and time zone per team and can turn it off
--    (teams.checkin_reminder_*; set through set_checkin_reminder()).
--  * Each athlete can opt out in Settings (profiles.checkin_reminder_opt_out)
--    or from the unsubscribe link in any reminder (no sign-in needed; the
--    link carries a random per-athlete token).
--  * The hourly job calls checkin_reminder_recipients() with the cron
--    secret. It only returns athletes who are due now, haven't checked in
--    today in the team's time zone and haven't been reminded today; it logs
--    each one so a repeated or late run never emails anyone twice.

alter table public.teams
  add column if not exists checkin_reminder_enabled boolean not null default false,
  add column if not exists checkin_reminder_hour smallint not null default 15,
  add column if not exists checkin_reminder_time_zone text not null default 'America/Los_Angeles';

alter table public.teams drop constraint if exists teams_checkin_reminder_hour_check;
alter table public.teams add constraint teams_checkin_reminder_hour_check
  check (checkin_reminder_hour between 0 and 23);

alter table public.profiles
  add column if not exists checkin_reminder_opt_out boolean not null default false,
  add column if not exists reminder_unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists profiles_reminder_unsubscribe_token_idx
  on public.profiles (reminder_unsubscribe_token);

-- Who was reminded on which local day. Private: only the functions below use it.
create schema if not exists private;
create table if not exists private.checkin_reminder_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, local_date)
);
alter table private.checkin_reminder_log enable row level security;
revoke all on private.checkin_reminder_log from public;
revoke all on private.checkin_reminder_log from anon, authenticated;

-- Coach-only: turn reminders on or off and pick the hour and time zone.
create or replace function public.set_checkin_reminder(
  p_team_id uuid,
  p_enabled boolean,
  p_hour smallint,
  p_time_zone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_team_coach(p_team_id) then
    raise exception 'You are not a coach of this team.';
  end if;
  if p_hour is null or p_hour < 0 or p_hour > 23 then
    raise exception 'Pick an hour between 0 and 23.';
  end if;
  if not exists (select 1 from pg_timezone_names where name = p_time_zone) then
    raise exception 'Unknown time zone.';
  end if;

  update public.teams
  set checkin_reminder_enabled = p_enabled,
      checkin_reminder_hour = p_hour,
      checkin_reminder_time_zone = p_time_zone
  where id = p_team_id;
end;
$$;

revoke all on function public.set_checkin_reminder(uuid, boolean, smallint, text) from public;
grant execute on function public.set_checkin_reminder(uuid, boolean, smallint, text) to authenticated;

-- One-tap unsubscribe from an email link. Knowing the random token is the
-- proof; it only ever turns reminders off.
create or replace function public.unsubscribe_checkin_reminders(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.profiles
  set checkin_reminder_opt_out = true
  where reminder_unsubscribe_token = p_token;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.unsubscribe_checkin_reminders(uuid) from public;
grant execute on function public.unsubscribe_checkin_reminders(uuid) to anon, authenticated;

-- The hourly job. Returns (and logs) the athletes to remind right now:
-- on a team with reminders on, at or up to 3 hours after the team's hour
-- (so a late or skipped run still sends), not opted out, not checked in
-- today in the team's time zone, and not already reminded today.
create or replace function public.checkin_reminder_recipients(p_secret text, p_now timestamptz default now())
returns table (
  user_id uuid,
  email text,
  display_name text,
  team_name text,
  unsubscribe_token uuid
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
      m.user_id,
      u.email::text as email,
      m.display_name,
      t.name as team_name,
      p.reminder_unsubscribe_token,
      (p_now at time zone t.checkin_reminder_time_zone)::date as local_date,
      t.checkin_reminder_time_zone as tz
    from public.teams t
    join public.team_members m on m.team_id = t.id and m.role = 'athlete'
    join public.profiles p on p.user_id = m.user_id
    join auth.users u on u.id = m.user_id
    where t.checkin_reminder_enabled
      and not p.checkin_reminder_opt_out
      and u.email is not null
      and extract(hour from (p_now at time zone t.checkin_reminder_time_zone))
          between t.checkin_reminder_hour and least(t.checkin_reminder_hour + 3, 23)
  ),
  not_checked_in as (
    select d.*
    from due d
    -- Checked in today = a stats_history entry created today in the team's
    -- time zone. (Not latest_stats.updated_at: nothing refreshes it on update.)
    where not exists (
      select 1 from public.stats_history sh
      where sh.user_id = d.user_id
        and (sh.created_at at time zone d.tz)::date = d.local_date
    )
  ),
  claimed as (
    insert into private.checkin_reminder_log (user_id, local_date)
    select n.user_id, n.local_date from not_checked_in n
    on conflict do nothing
    returning private.checkin_reminder_log.user_id
  )
  select n.user_id, n.email, n.display_name, n.team_name, n.reminder_unsubscribe_token
  from not_checked_in n
  join claimed c on c.user_id = n.user_id;
end;
$$;

revoke all on function public.checkin_reminder_recipients(text, timestamptz) from public;
grant execute on function public.checkin_reminder_recipients(text, timestamptz) to anon, authenticated;
